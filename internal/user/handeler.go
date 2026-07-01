package user

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}
func (H *Handler) Index(ctx *gin.Context) {

}
func (H *Handler) Create(ctx *gin.Context) {

}

func (H *Handler) Show(ctx *gin.Context) {

}
func (H *Handler) Update(ctx *gin.Context) {

}
func (H *Handler) Delete(ctx *gin.Context) {

}
