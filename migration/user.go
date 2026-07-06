package migration

import (
	"gorm.io/gorm"

	"crazyDev/pkg/sqlite"
)

// User مدل کاربر
type User struct {
	Name     string `json:"name" gorm:"unique;not null"` // نام کاربری رو یونیک در نظر گرفتم
	Password string `json:"-" gorm:"not null"`
	sqlite.BaseModel
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
