package command

import "encoding/json"

type CreateCommandRequest struct {
	Alias       string          `json:"alias" binding:"required,max=50"`
	Command     string          `json:"command" binding:"required,max=100"`
	FrameworkID string          `json:"framework_id" binding:"required"`
	Description string          `json:"description"`
	Options     json.RawMessage `json:"options"`
	IsFeatured  bool            `json:"is_featured"`
}

type UpdateCommandRequest struct {
	Alias       *string          `json:"alias" binding:"omitempty,max=50"`
	Command     *string          `json:"command" binding:"omitempty,max=100"`
	FrameworkID *string          `json:"framework_id"`
	Description *string          `json:"description"`
	Options     *json.RawMessage `json:"options"`
	SortOrder   *int             `json:"sort_order"`
	IsFeatured  *bool            `json:"is_featured"`
}
