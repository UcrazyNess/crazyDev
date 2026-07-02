package migration

import (
	"gorm.io/gorm"

	"crazyDev/pkg/dbsqli"
)

// User مدل کاربر
type User struct {
	Name     string `json:"name" gorm:"unique;not null"` // نام کاربری رو یونیک در نظر گرفتم
	Password string `json:"-" gorm:"not null"`
	dbsqli.BaseModel
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Session مدل سشن برای مدیریت نشست‌ها

func GetByID(db *gorm.DB, id uint) *User {
	var user User
	if err := db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil
	}
	return &user
}
