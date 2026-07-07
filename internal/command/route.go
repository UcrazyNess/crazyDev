package command

import (
	"gorm.io/gorm"

	"crazyDev/pkg/middleware/authorizeSession"
	"crazyDev/pkg/routing"
)

func SetupRouter(r *routing.Router, db *gorm.DB) {
	h := NewHandler(db)
	cmndGrp := r.WithMiddlewares(authorizeSession.AuthorizeSession(db)).Group("command")
	cmndGrp.GET("/", h.Index)
	cmndGrp.POST("/", h.Store)
	cmndGrp.PUT("/:id", h.Update)
	cmndGrp.GET("/:id", h.Show)
	cmndGrp.DELETE("/:id", h.Delete)
}
