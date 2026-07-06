package migration

import (
	"crazyDev/pkg/dbsqli"

	"gorm.io/gorm"
)

// User مدل کاربر
type User struct {
	Name     string `json:"name" gorm:"unique;not null"` // نام کاربری رو یونیک در نظر گرفتم
	Password string `json:"-" gorm:"not null"`
	dbsqli.BaseModel
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
