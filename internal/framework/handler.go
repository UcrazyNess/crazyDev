package framework

import (
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

func (h *Handler) index(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	result, err := sqlite.Paginate[migration.Framework](h.db, offset, 10, c.Request.URL.Path)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, result)
}
