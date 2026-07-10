package compose

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	var dockerCompose migration.DockerCompose
	result, err := sqlite.Paginate[migration.DockerCompose](h.db.Preload("IPs").Model(dockerCompose), offset, 10, c.Request.URL.Path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست داکر کامپوز ها"})
		return
	}

	c.JSON(http.StatusOK, result)
}
func (h *Handler) Generate(c *gin.Context) {
	var req CreateAndGenerateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IPs) > 0 {
		var existingIPs []string
		h.db.Model(&migration.ComposeIP{}).
			Where("ip_address IN ?", req.IPs).
			Pluck("ip_address", &existingIPs)

		if len(existingIPs) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":          "یک یا چند آی‌پی وارد شده قبلاً استفاده شده است",
				"duplicated_ips": existingIPs,
			})
			return
		}
	}

	yamlBytes, err := GenerateComposeYAML(req.Compose)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در فرمت‌بندی YAML"})
		return
	}

	targetDir := "./storage/docker-Compose/"
	err = os.MkdirAll(targetDir, 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد دایرکتوری"})
		return
	}
	fileName := fmt.Sprintf("%s-docker-compose.yml", uuid.New().String())
	filePath := filepath.Join(targetDir, fileName)
	err = os.WriteFile(filePath, yamlBytes, 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("خطا در ذخیره فایل روی هارد :\n %s", err.Error()),
		})
		return
	}

	var composeIPs []migration.ComposeIP
	for _, ip := range req.IPs {
		composeIPs = append(composeIPs, migration.ComposeIP{IPAddress: ip})
	}

	dbRecord := migration.DockerCompose{
		ProjectName: req.ProjectName,
		Path:        filePath,
		YAMLContent: string(yamlBytes),
		IPs:         composeIPs,
	}

	if err := h.db.Create(&dbRecord).Error; err != nil {
		_ = os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره اطلاعات در دیتابیس"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "پروژه و فایل داکر کامپوز با موفقیت ساخته و ذخیره شدند",
		"project_id": dbRecord.ID,
		"path":       filePath,
		"yaml":       string(yamlBytes),
	})
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var dockerCompose migration.DockerCompose

	if err := h.db.Preload("IPs").First(&dockerCompose, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر پیدا نشد"})
		return
	}

	var req UpdateComposeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IPs) > 0 {
		var existingIPs []string
		h.db.Model(&migration.ComposeIP{}).
			Where("ip_address IN ? AND compose_id != ?", req.IPs, dockerCompose.ID).
			Pluck("ip_address", &existingIPs)

		if len(existingIPs) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":          "یک یا چند آی‌پی توسط پروژه دیگری رزرو شده است",
				"duplicated_ips": existingIPs,
			})
			return
		}
	}

	oldPath := dockerCompose.Path
	fileChanged := false
	var yamlBytes []byte
	var err error

	if req.Compose != nil {
		yamlBytes, err = GenerateComposeYAML(*req.Compose)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در فرمت‌بندی YAML"})
			return
		}
		fileChanged = true
	}

	tx := h.db.Begin()

	dockerCompose.ProjectName = *req.ProjectName

	if fileChanged {
		targetDir := req.Path
		_ = os.MkdirAll(*targetDir, os.ModePerm)
		fileName := fmt.Sprintf("%s-docker-compose.yml", uuid.New().String())
		newFilePath := filepath.Join(*targetDir, fileName)

		if err := os.WriteFile(newFilePath, yamlBytes, 0644); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل جدید"})
			return
		}
		dockerCompose.Path = newFilePath
		dockerCompose.YAMLContent = string(yamlBytes)
	}

	if err := tx.Where("compose_id = ?", dockerCompose.ID).Delete(&migration.ComposeIP{}).Error; err != nil {
		tx.Rollback()
		if fileChanged {
			_ = os.Remove(dockerCompose.Path)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در پاکسازی آی‌پی‌های قدیمی"})
		return
	}

	var newIPs []migration.ComposeIP
	for _, ip := range req.IPs {
		newIPs = append(newIPs, migration.ComposeIP{IPAddress: ip, ComposeID: dockerCompose.ID})
	}
	if len(newIPs) > 0 {
		if err := tx.Create(&newIPs).Error; err != nil {
			tx.Rollback()
			if fileChanged {
				_ = os.Remove(dockerCompose.Path)
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت آی‌پی‌های جدید"})
			return
		}
	}

	if err := tx.Save(&dockerCompose).Error; err != nil {
		tx.Rollback()
		if fileChanged {
			_ = os.Remove(dockerCompose.Path)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی نهایی پروژه"})
		return
	}

	tx.Commit()

	if fileChanged && oldPath != "" {
		_ = os.Remove(oldPath)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "پروژه با موفقیت ویرایش و به روزرسانی شد",
		"project": dockerCompose,
	})
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	var dockerCompose migration.DockerCompose

	if err := h.db.First(&dockerCompose, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر پیدا نشد"})
		return
	}

	tx := h.db.Begin()

	if err := tx.Where("compose_id = ?", dockerCompose.ID).Delete(&migration.ComposeIP{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف آی‌پی‌های پروژه"})
		return
	}

	if err := tx.Delete(&dockerCompose).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف پروژه از دیتابیس"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در نهایی‌سازی حذف"})
		return
	}

	if dockerCompose.Path != "" {
		if _, err := os.Stat(dockerCompose.Path); err == nil {
			if err := os.Remove(dockerCompose.Path); err != nil {
				fmt.Printf("Warning: Failed to delete file at %s: %v\n", dockerCompose.Path, err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "پروژه، آی‌پی‌های متصل و فایل کامپوز مربوطه با موفقیت حذف شدند",
	})
}

func (h *Handler) Download(c *gin.Context) {
	id := c.Param("id")
	var dc migration.DockerCompose

	// استفاده از First برای پیدا کردن رکورد
	if err := h.db.First(&dc, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه پیدا نشد"})
		return
	}

	fullURL := fmt.Sprintf("http://%s/%s", c.Request.Host, dc.Path)

	c.JSON(http.StatusOK, gin.H{
		"url": fullURL,
	})
}
