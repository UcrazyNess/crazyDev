package command

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
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
func (h *Handler) Store(c *gin.Context) {
	var req CreateCommandRequest

	if err := c.ShouldBind(&req); err != nil {
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
	var finalFilePath string
	var targetPath string
	if req.IsFeatured {
		var maxOrder int
		h.db.Model(&migration.Command{}).
			Where("framework_id = ?", req.FrameworkID).
			Select("COALESCE(MAX(sort_order), 0)").
			Scan(&maxOrder)
		nextOrder := maxOrder + 1
		sortOrder = &nextOrder
	}

	if req.ActionType == "generate" {
		if req.File == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "فایل الزامی است"})
			return
		}
		if req.Filename == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "نام فایل الزامی است"})
			return
		}
		if req.Path == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "مسیر ساخت فایل الزامی است"})
			return
		}
		targetPath = *req.Path

		dirPath := filepath.Join("storage", "commands", req.FrameworkID)

		if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد مسیر فایل"})
			return
		}

		finalFilePath = filepath.Join(dirPath, *req.Filename)

		if err := os.WriteFile(finalFilePath, []byte(*req.File), 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل"})
			return
		}
	}
	if req.ActionType == "execute" {
		req.File = nil
		req.Path = nil
	}
	command := migration.Command{
		Alias:       req.Alias,
		Command:     req.Command,
		FrameworkID: req.FrameworkID,
		Description: req.Description,
		Options:     string(req.Options),
		IsFeatured:  req.IsFeatured,
		SortOrder:   sortOrder,
		FilePath:    finalFilePath,
		Path:        targetPath,
		ActionType:  migration.CommandActionType(req.ActionType),
	}

	if err := h.db.Create(&command).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره سازی داده"})
		return
	}

	c.JSON(http.StatusCreated, command)
}

func (h *Handler) Download(c *gin.Context) {
	id := c.Param("id")
	var command migration.Command

	// استفاده از First برای پیدا کردن رکورد
	if err := h.db.First(&command, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه پیدا نشد"})
		return
	}
	if command.ActionType != "generate" {
		c.JSON(http.StatusNotFound, gin.H{"error": "دستور مورد نظر دارای فایل نمی باشد"})
		return
	}

	fullURL := fmt.Sprintf("http://%s/%s", c.Request.Host, command.FilePath)

	c.JSON(http.StatusOK, gin.H{
		"url": fullURL,
	})
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var command migration.Command

	if err := h.db.First(&command, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "دستور مورد نظر پیدا نشد"})
		return
	}

	var req UpdateCommandRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.File != nil {
		targetFrameworkID := command.FrameworkID
		if req.FrameworkID != nil {
			targetFrameworkID = *req.FrameworkID
		}

		dirPath := filepath.Join("storage", "commands", targetFrameworkID)
		if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد مسیر ذخیره‌سازی سرور"})
			return
		}

		finalFilePath := filepath.Join(dirPath, *req.Filename)

		if command.FilePath != "" && command.FilePath != finalFilePath {
			_ = os.Remove(command.FilePath)
		}

		if err := os.WriteFile(finalFilePath, []byte(*req.File), 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل"})
			return
		}

		command.FilePath = finalFilePath
	}

	if req.Alias != nil {
		command.Alias = *req.Alias
	}
	if req.Command != nil {
		command.Command = *req.Command
	}
	if req.FrameworkID != nil {
		command.FrameworkID = *req.FrameworkID
	}
	if req.Description != nil {
		command.Description = *req.Description
	}
	if req.Options != nil {
		command.Options = string(*req.Options)
	}
	if req.SortOrder != nil {
		command.SortOrder = req.SortOrder
	}
	if req.IsFeatured != nil {
		command.IsFeatured = *req.IsFeatured
	}
	if req.Path != nil {
		command.Path = *req.Path
	}

	// ۴. ذخیره کل رکورد در دیتابیس با متد Save
	if err := h.db.Save(&command).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی"})
		return
	}

	c.JSON(http.StatusOK, command)
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	var command migration.Command

	if err := h.db.First(&command, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "دستور مورد نظر پیدا نشد"})
		return
	}

	if command.FilePath != "" {
		_ = os.Remove(command.FilePath)
	}

	if err := h.db.Delete(&command).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف رکورد"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "دستور و فایل مربوطه با موفقیت حذف شدند"})
}
