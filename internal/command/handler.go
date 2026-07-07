package command

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"crazyDev/migration"
	"crazyDev/pkg/sqlite"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// 1. لیست دستور (همان کدی که خودت نوشتی)
func (h *Handler) Index(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	frameworkSlug := c.Query("framework")
	var command migration.Command
	query := h.db.Model(&command)
	if frameworkSlug != "" {
		query = query.Where("framework_id IN (SELECT id FROM frameworks WHERE slug = ?)", frameworkSlug)
	}
	result, err := sqlite.Paginate[migration.Command](
		query,
		offset,
		10,
		c.Request.URL.Path,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// 2. ساخت دستور جدید
func (h *Handler) Store(c *gin.Context) {
	var req CreateCommandRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var count int64
	h.db.Table("frameworks").Where("id = ?", req.FrameworkID).Count(&count)
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "فریم ورک پیدا نشد"})
		return
	}
	var sortOrder *int

	if req.IsFeatured {
		var maxOrder int
		h.db.Model(&migration.Command{}).
			Where("framework_id = ?", req.FrameworkID).
			Select("COALESCE(MAX(sort_order), 0)").
			Scan(&maxOrder)
		nextOrder := maxOrder + 1
		sortOrder = &nextOrder
	}
	command := migration.Command{
		Alias:       req.Alias,
		Command:     req.Command,
		FrameworkID: req.FrameworkID,
		Description: req.Description,
		Options:     string(req.Options),
		IsFeatured:  req.IsFeatured,
		SortOrder:   sortOrder,
	}

	if err := h.db.Create(&command).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره سازی داده"})
		return
	}

	c.JSON(http.StatusCreated, command)
}

// 3. نمایش یک دستور خاص بر اساس ID یا Slug (در اینجا بر اساس ID)
func (h *Handler) Show(c *gin.Context) {
	id := c.Param("id")
	var command migration.Command

	if err := h.db.First(&command, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "دستور مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, command)
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var command migration.Command

	if err := h.db.First(&command, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "دستور مورد نظر پیدا نشد"})
		return
	}

	var req UpdateCommandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.FrameworkID != nil {
		var count int64
		h.db.Table("frameworks").Where("id = ?", req.FrameworkID).Count(&count)
		if count == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "فریم ورک پیدا نشد"})
			return
		}
	}

	if err := h.db.Model(&command).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی"})
		return
	}

	c.JSON(http.StatusOK, command)
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	var command migration.Command

	if err := h.db.Delete(&command, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف رکورد"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "دستور با موفقیت حذف شد"})
}
