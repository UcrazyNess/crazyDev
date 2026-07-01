package routing

import (
	"fmt"
	"log"
	"net/http"
	"runtime"
	"runtime/debug"
	"strings"

	"github.com/gin-gonic/gin"
)

type Router struct {
	grp *gin.RouterGroup
	app *gin.Engine
}

func recovery(ctx *gin.Context, err any) {
	// ۱. استخراج پیغام خطا به صورت متنی
	var errMsg string
	switch v := err.(type) {
	case error:
		errMsg = v.Error()
	case string:
		errMsg = v
	default:
		errMsg = fmt.Sprintf("%v", err)
	}

	// ۲. ردیابی هوشمند منشا خطا در کدهای توسعه‌دهنده (رد کردن فریم‌ورک‌های داخلی و ران‌تایم Go)
	errorType := "خطای نامشخص در سیستم (Runtime Exception)"
	errorFile := "نامشخص"
	errorLine := 0

	// پیمایش پشته برای پیدا کردن اولین فایلی که مربوط به پکیج‌های سیستمی یا gin نیست
	for i := 2; i < 15; i++ {
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}
		fn := runtime.FuncForPC(pc)
		if fn == nil {
			continue
		}
		fnName := fn.Name()

		// اگر خط مربوط به فریم‌ورک Gin یا ران‌تایم Go یا پکیج روتینگ خودمان نبود، منبع اصلی باگ است
		if !strings.Contains(fnName, "github.com/gin-gonic/gin") &&
			!strings.Contains(fnName, "runtime.") &&
			!strings.Contains(fnName, "pkg/routing") {

			// استخراج نام پکیج و تابع برای زیبایی بیشتر در نمایش
			parts := strings.Split(fnName, "/")
			if len(parts) > 0 {
				fnName = parts[len(parts)-1]
			}

			errorType = fmt.Sprintf("باگ در تابع %s", fnName)
			errorFile = file
			errorLine = line
			break
		}
	}

	// فرمت‌نویسی نهایی پیام خطا به همراه لوکیشن دقیق برای نمایش در کادر قرمز رنگ ترمینال
	formattedErrorMessage := fmt.Sprintf("%s\n\n📍 فایل آسیب‌دیده:\n%s (Line %d)", errMsg, errorFile, errorLine)

	// چاپ کردن لاگ کامل به همراه استک تریس در ترمینال سرور جهت عیب‌یابی توسعه‌دهنده
	log.Printf("[PANIC RECOVERED] %s\nStack Trace:\n%s", errMsg, string(debug.Stack()))

	// ۳. پاسخ‌دهی هوشمند بر اساس نوع ریکوئست کلاینت (HTML یا JSON)

	// در غیر این صورت صفحه عیب‌یابی زیبای قرمز رنگ را رندر می‌کنیم
	ctx.HTML(http.StatusInternalServerError, "error.html", gin.H{
		"ErrorType":    errorType,
		"ErrorMessage": formattedErrorMessage,
		"Path":         ctx.Request.URL.Path,
		"Method":       ctx.Request.Method,
	})

	// متوقف کردن ادامه زنجیره هندلرها برای عدم پردازش کدهای ناقص بعدی
	ctx.Abort()
}

func expectsJSON(ctx *gin.Context) bool {
	accept := ctx.GetHeader("Accept")
	contentType := ctx.GetHeader("Content-Type")
	return strings.Contains(accept, "application/json") || strings.Contains(contentType, "application/json")
}

type routerMethods func(path string, hndlr gin.HandlerFunc)

func (r *Router) Get(path string, hndlr gin.HandlerFunc) {
	r.grp.GET(path, hndlr)
}

func (r *Router) POST(path string, hndlr gin.HandlerFunc) {
	r.grp.POST(path, hndlr)
}

func (r *Router) PUT(path string, hndlr gin.HandlerFunc) {
	r.grp.PUT(path, hndlr)
}

func (r *Router) PATCH(path string, hndlr gin.HandlerFunc) {
	r.grp.PATCH(path, hndlr)
}

func (r *Router) DELETE(path string, hndlr gin.HandlerFunc) {
	r.grp.DELETE(path, hndlr)
}

func (r *Router) Group(path string) *gin.RouterGroup {
	return r.grp.Group(path)
}

func (r *Router) Exec() *gin.Engine {
	return r.app
}
