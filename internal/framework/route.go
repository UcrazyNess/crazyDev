package framework

import (
	"gorm.io/gorm"

	"crazyDev/pkg/middleware/authorizeSession"
	"crazyDev/pkg/routing"
)

func SetupRouter(r *routing.Router, db *gorm.DB) {
	h := NewHandler(db)
	frmwrckGrp := r.WithMiddlewares(authorizeSession.AuthorizeSession(db)).Group("framework")
	frmwrckGrp.GET("/", h.Index)
	frmwrckGrp.POST("/", h.Store)
	frmwrckGrp.PUT("/:slug", h.Update)
	frmwrckGrp.GET("/:slug", h.Show)
	frmwrckGrp.DELETE("/:slug", h.Delete)
}
