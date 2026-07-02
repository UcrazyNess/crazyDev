package user

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"crazyDev/migration"
	"crazyDev/pkg/middleware/authorizeSession"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Rgister(ctx *gin.Context) {
	var req RegisterRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.AbortWithStatusJSON(403, gin.H{
			"error":   true,
			"message": "اطلاعات ارسالی معتبر نیست. لطفاً ورودی‌ها را بررسی کنید.",
			"details": err.Error(),
		})
		return
	}
	req.Name = strings.ToLower(strings.TrimSpace(req.Name))
	var existingUser migration.User
	err := h.db.Where("name = ? ", req.Name).First(&existingUser).Error
	if err == nil {
		ctx.AbortWithStatusJSON(403, gin.H{
			"error":   true,
			"message": "نام کاربری وارد شده قبلاً در سیستم ثبت شده است.",
		})
		return
	}

	hashedPassword, err := authorizeSession.Hash(req.Password)
	if err != nil {
		ctx.AbortWithStatusJSON(500, gin.H{
			"error":   true,
			"message": "خطا در پردازش",
		})
		return
	}
	newUser := migration.User{
		Name:     req.Name,
		Password: hashedPassword, // ذخیره پسورد امن شده
	}
	if err := h.db.Create(&newUser).Error; err != nil {
		ctx.AbortWithStatusJSON(500, gin.H{
			"error":   true,
			"message": "خطا در ذخیره‌سازی اطلاعات کاربر در دیتابیس.",
		})
		return
	}
	plaintextToken, err := authorizeSession.Authorize(h.db, newUser)
	if err == nil {
		ctx.SetCookie(
			"session_token",
			plaintextToken,
			86400,
			"/",   // مسیر فعال بودن کوکی
			"",    // دامنه کلاینت (خالی به معنای دامنه فعلی)
			false, // گزینه Secure (در صورت وجود SSL روی وب‌سایت ترو کنید)
			true,
		)
	}
	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "ثبت‌نام شما با موفقیت انجام شد.",
		"user": gin.H{
			"id":         newUser.ID,
			"username":   newUser.Name,
			"created_at": newUser.CreatedAt,
		},
	})

}

func (h *Handler) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"error":   true,
			"message": "نام کاربری و رمز عبور الزامی است.",
			"details": err.Error(),
		})
		return
	}
	req.Name = strings.ToLower(strings.TrimSpace(req.Name))
	var targetUser migration.User
	err := h.db.Where("name = ?", req.Name).First(&targetUser).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   true,
				"message": "نام کاربری یا رمز عبور اشتباه است.",
			})
			return
		}
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"error":   true,
			"message": "خطا در برقراری ارتباط با بانک اطلاعاتی.",
		})
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(targetUser.Password), []byte(req.Password))
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error":   true,
			"message": "نام رمز عبور اشتباه است.",
		})
		return
	}
	plaintextToken, err := authorizeSession.Authorize(h.db, targetUser)
	if err != nil {
		ctx.Redirect(500, "/login")
	}
	ctx.SetCookie(
		"session_token",
		plaintextToken,
		86400,
		"/",   // مسیر فعال بودن کوکی
		"",    // دامنه کلاینت (خالی به معنای دامنه فعلی)
		false, // گزینه Secure (در صورت وجود SSL روی وب‌سایت ترو کنید)
		true,
	)
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "ورود شما با موفقیت انجام شد.",
		"user": gin.H{
			"id":       targetUser.ID,
			"username": targetUser.Name,
		},
	})
}

func (h *Handler) Show(ctx *gin.Context) {
	val, ok := ctx.Get("user")
	if !ok {
		ctx.Redirect(302, "/login")
		return
	}
	user := val.(migration.User)
	ctx.JSON(200, gin.H{
		"user": gin.H{
			"id":       user.ID,
			"username": user.Name,
		},
	})
}
func (h *Handler) Update(ctx *gin.Context) {

}
func (h *Handler) Delete(ctx *gin.Context) {

}
