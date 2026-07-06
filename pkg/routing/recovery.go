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
	formattedErrorMessage := fmt.Sprintf("%s\n\n📍 فایل آسیب دیده:\n%s (Line %d)", errMsg, errorFile, errorLine)

	// چاپ کردن لاگ کامل به همراه استک تریس در ترمینال سرور جهت عیب‌یابی توسعه‌دهنده
	log.Printf("[PANIC RECOVERED] %s\nStack Trace:\n%s", errMsg, string(debug.Stack()))

	if ExpectsJSON(ctx) {
		// اگر کلاینت درخواست API داده بود، پاسخ را به صورت JSON تمیز برمی‌گردانیم
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":      true,
			"error_type": errorType,
			"message":    errMsg,
			"file":       errorFile,
			"line":       errorLine,
			"path":       ctx.Request.URL.Path,
			"method":     ctx.Request.Method,
		})
	} else {
		// در غیر این صورت صفحه عیب‌یابی زیبای قرمز رنگ را رندر می‌کنیم
		ctx.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"ErrorType":    errorType,
			"ErrorMessage": formattedErrorMessage,
			"Path":         ctx.Request.URL.Path,
			"Method":       ctx.Request.Method,
		})
	}

	// متوقف کردن ادامه زنجیره هندلرها برای عدم پردازش کدهای ناقص بعدی
	ctx.Abort()
}

func ExpectsJSON(ctx *gin.Context) bool {
	accept := ctx.GetHeader("Accept")
	contentType := ctx.GetHeader("Content-Type")
	return strings.Contains(accept, "application/json") || strings.Contains(contentType, "application/json")
}
