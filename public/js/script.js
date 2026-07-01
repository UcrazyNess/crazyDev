function copyCode() {
    const textToCopy = "git clone https://github.com/UcrazyNess/crazyDev.git\ncd crazyDev\ngo run main.go";
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const toast = document.getElementById('copyToast');
        toast.classList.remove('opacity-0');
        
        setTimeout(() => {
            toast.classList.add('opacity-0');
        }, 2000);
    }).catch(err => {
        console.error('خطا در کپی: ', err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const toast = document.getElementById('copyToast');
            toast.classList.remove('opacity-0');
            setTimeout(() => {
                toast.classList.add('opacity-0');
            }, 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    });
}