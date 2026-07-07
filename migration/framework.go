package migration

import (
	"crazyDev/pkg/sqlite"
)

type Framework struct {
	sqlite.BaseModel

	Name          string `json:"name" gorm:"type:varchar(100);unique;not null"`
	Language      string `json:"language" gorm:"type:varchar(100);not null"`
	Slug          string `json:"slug" gorm:"type:varchar(100);unique;not null;index"`
	Description   string `json:"description" gorm:"type:text"`
	Website       string `json:"website" gorm:"type:varchar(255)"`
	Repository    string `json:"repository" gorm:"type:varchar(255)"`
	LatestVersion string `json:"latest_version" gorm:"type:varchar(50)"`
	Stars         int    `json:"stars" gorm:"default:0"`
	IsFeatured    bool   `json:"is_featured" gorm:"default:false"`
}
