package compose

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Generate(c *gin.Context) {
	var req GenerateComposeRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// ۱. تولید بایت‌های YAML
	yamlBytes, err := GenerateComposeYAML(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در فرمت‌بندی YAML"})
		return
	}

	// ۲. ذخیره فایل روی دیسک (مثلاً در یک پوشه مشخص)
	targetDir := "./storage/docker-Compose/"
	_ = os.MkdirAll(targetDir, os.ModePerm) // مطمئن می‌شویم پوشه وجود دارد
	fileName := fmt.Sprintf("%s-docker-compose.yml", uuid.New().String())
	filePath := filepath.Join(targetDir, fileName)
	err = os.WriteFile(filePath, yamlBytes, 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل روی هارد"})
		return
	}

	// ۳. بازگرداندن متن YAML به فرانت‌اند جهت نمایش به کاربر
	c.JSON(http.StatusOK, gin.H{
		"message": "فایل داکر کامپوز با موفقیت ساخته و ذخیره شد",
		"path":    filePath,
		"yaml":    string(yamlBytes),
	})
}
