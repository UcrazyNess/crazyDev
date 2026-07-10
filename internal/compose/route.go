package compose

import (
	"gorm.io/gorm"

	"crazyDev/pkg/middleware/authorizeSession"
	"crazyDev/pkg/routing"
)

func SetupRouter(r *routing.Router, db *gorm.DB) {
	h := NewHandler(db)
	cmpsGrp := r.WithMiddlewares(authorizeSession.AuthorizeSession(db)).Group("compose")
	cmpsGrp.POST("/genrate", h.Generate)
	cmpsGrp.GET("/", h.Index)
	cmpsGrp.PUT("/:id", h.Update)
	cmpsGrp.DELETE("/:id", h.Delete)
	cmpsGrp.GET("/download/:id", h.Download)
}
