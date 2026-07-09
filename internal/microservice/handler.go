package microservice

import (
	"errors"
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

// 1. لیست میکروسرویس
func (h *Handler) Index(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	var microservice migration.Microservice
	result, err := sqlite.Paginate[migration.Microservice](h.db.Model(microservice), offset, 10, c.Request.URL.Path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست میکروسرویس"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// 2. ساخت میکروسرویس جدید
func (h *Handler) Store(c *gin.Context) {
	var req CreateMicroserviceRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.SourceType == string(migration.SourcePull) {
		if req.Dockerfile != "" || req.Build != "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "وقتی وضعیت روی pull قرار دارد، نمی‌توانید کدهای داکرفایل یا مسیر build را ارسال کنید",
			})
			return
		}
	} else if req.Image != "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "وقتی وضعیت روی pull قرار دارد، نمی‌توانید کدهای داکرفایل یا مسیر build را ارسال کنید",
		})
		return
	}

	microservice := migration.Microservice{
		Name:        req.Name,
		SourceType:  migration.ImageSourceType(req.SourceType),
		Dockerfile:  req.Dockerfile,
		Build:       req.Build,
		Image:       req.Image,
		Environment: req.Environment,
		Healthcheck: req.Healthcheck,
		Command:     req.Command,
		Restart:     req.Restart,
	}

	if err := h.db.Create(&microservice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره سازی داده"})
		return
	}

	c.JSON(http.StatusCreated, microservice)
}

// 3. نمایش یک میکروسرویس خاص بر اساس Slug
func (h *Handler) Show(c *gin.Context) {
	id := c.Param("id")
	var microservice migration.Microservice

	err := h.db.Preload("Commands", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order IS NULL, sort_order DESC")
	}).Where("id = ?", id).First(&microservice).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "میکروسرویس مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بازیابی اطلاعات"})
		return
	}

	c.JSON(http.StatusOK, microservice)
}

// 4. بروزرسانی میکروسرویس
func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var microservice migration.Microservice

	if err := h.db.First(&microservice, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "میکروسرویس مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی اطلاعات دیتابیس"})
		return
	}

	var req UpdateMicroserviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Model(&microservice).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی رکورد"})
		return
	}

	c.JSON(http.StatusOK, microservice)
}

// 5. حذف میکروسرویس
func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	var microservice migration.Microservice

	if err := h.db.Where("id = ?", id).First(&microservice).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "میکروسرویس مورد نظر پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی اطلاعات دیتابیس"})
		return
	}

	if err := h.db.Delete(&microservice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف رکورد"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "میکروسرویس با موفقیت حذف شد"})
}
