package framework

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

// 1. لیست فریمورک‌ها (همان کدی که خودت نوشتی)
func (h *Handler) Index(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	result, err := sqlite.Paginate[migration.Framework](h.db, offset, 10, c.Request.URL.Path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// 2. ساخت فریمورک جدید
func (h *Handler) Store(c *gin.Context) {
	var req CreateFrameworkRequest

	// ولیدیشن خودکار ورودی‌ها بر اساس تگ‌های binding
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 🛠️ ساخت خودکار Slug از روی نام فریمورک (مثال ساده: تبدیل به حروف کوچک و خط تیره)
	// در دنیای واقعی بهتر است یک تابع کمکی برای این کار در pkg بسازی
	slug := req.Name // اینجا می‌توانید تابع slugify را صدا بزنید

	framework := migration.Framework{
		Name:        req.Name,
		Language:    req.Language,
		Slug:        slug,
		Description: req.Description,
		Website:     req.Website,
		Repository:  req.Repository,
		IsFeatured:  req.IsFeatured,
	}

	if err := h.db.Create(&framework).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره سازی داده"})
		return
	}

	c.JSON(http.StatusCreated, framework)
}

// 3. نمایش یک فریمورک خاص بر اساس ID یا Slug (در اینجا بر اساس ID)
func (h *Handler) Show(c *gin.Context) {
	id := c.Param("id")
	var framework migration.Framework

	if err := h.db.First(&framework, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "فریمورک مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, framework)
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var framework migration.Framework

	if err := h.db.First(&framework, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "فریمورک پیدا نشد"})
		return
	}

	var req UpdateFrameworkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Model(&framework).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی"})
		return
	}

	c.JSON(http.StatusOK, framework)
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	var framework migration.Framework

	if err := h.db.Delete(&framework, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف رکورد"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "فریمورک با موفقیت حذف شد"})
}
