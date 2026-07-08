package framework

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

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

// 1. لیست فریمورک‌ها
func (h *Handler) Index(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	var framework migration.Framework
	result, err := sqlite.Paginate[migration.Framework](h.db.Model(framework), offset, 10, c.Request.URL.Path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست فریمورک‌ها"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// 2. ساخت فریمورک جدید
func (h *Handler) Store(c *gin.Context) {
	var req CreateFrameworkRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))

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

// 3. نمایش یک فریمورک خاص بر اساس Slug
func (h *Handler) Show(c *gin.Context) {
	slug := c.Param("slug")
	var framework migration.Framework

	// حذف زواید Count و اعمال درست Preload و کوئری اول
	err := h.db.Preload("Commands", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order IS NULL, sort_order DESC")
	}).Where("slug = ?", slug).First(&framework).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "فریمورک مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بازیابی اطلاعات"})
		return
	}

	c.JSON(http.StatusOK, framework)
}

// 4. بروزرسانی فریمورک
func (h *Handler) Update(c *gin.Context) {
	slug := c.Param("slug")
	var framework migration.Framework

	if err := h.db.Where("slug = ?", slug).First(&framework).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "فریمورک مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی اطلاعات دیتابیس"})
		return
	}

	var req UpdateFrameworkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Model(&framework).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی رکورد"})
		return
	}

	c.JSON(http.StatusOK, framework)
}

// 5. حذف فریمورک
func (h *Handler) Delete(c *gin.Context) {
	slug := c.Param("slug")
	var framework migration.Framework

	if err := h.db.Where("slug = ?", slug).First(&framework).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "فریمورک مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی اطلاعات دیتابیس"})
		return
	}

	if err := h.db.Delete(&framework).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف رکورد"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "فریمورک با موفقیت حذف شد"})
}
