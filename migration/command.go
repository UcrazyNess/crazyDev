package migration

import (
	"crazyDev/pkg/sqlite"
)

type Command struct {
	sqlite.BaseModel

	Alias       string    `json:"alias" gorm:"type:varchar(50)"`
	Command     string    `json:"command" gorm:"type:varchar(100)"`
	FrameworkID string    `json:"framework_id" gorm:"index"`
	Framework   Framework `json:"-" gorm:"foreignKey:FrameworkID;constraint:OnDelete:CASCADE;"`
	Description string    `json:"description" gorm:"type:text"`
	Options     string    `json:"options" gorm:"type:text"`
	SortOrder   *int      `json:"sort_order" gorm:"column:sort_order"`
	IsFeatured  bool      `json:"is_featured" gorm:"default:false"`
}
