package migration

import (
	"time"

	"crazyDev/pkg/dbsqli"
)

type Session struct {
	UserID       uint      `json:"user_id" gorm:"not null;index"`
	User         User      `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
	SessionToken string    `json:"session_token" gorm:"unique;not null;index"`
	ExpiresAt    time.Time `json:"expires_at" gorm:"not null"`
	dbsqli.BaseModel
}
