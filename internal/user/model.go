package user

import (
	"time"

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
type Session struct {
	UserID       uint      `json:"user_id" gorm:"not null;index"`
	User         User      `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
	SessionToken string    `json:"session_token" gorm:"unique;not null;index"`
	ExpiresAt    time.Time `json:"expires_at" gorm:"not null"`
	dbsqli.BaseModel
}
