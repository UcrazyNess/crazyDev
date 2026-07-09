package microservice

import (
	"gorm.io/gorm"

	"crazyDev/pkg/middleware/authorizeSession"
	"crazyDev/pkg/routing"
)

func SetupRouter(r *routing.Router, db *gorm.DB) {
	h := NewHandler(db)
	mcrsrvcGrp := r.WithMiddlewares(authorizeSession.AuthorizeSession(db)).Group("microservice")
	mcrsrvcGrp.GET("/", h.Index)
	mcrsrvcGrp.POST("/", h.Store)
	mcrsrvcGrp.PUT("/:id", h.Update)
	mcrsrvcGrp.GET("/:id", h.Show)
	mcrsrvcGrp.DELETE("/:id", h.Delete)
}
