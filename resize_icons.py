from PIL import Image
import os
from pathlib import Path

# Папка с иконками
icons_dir = r"c:\Users\2ой пользователь\kpop 1.4\game\public\teamicons"

# Получить список всех PNG файлов
png_files = list(Path(icons_dir).glob("*.png"))

print(f"Найдено {len(png_files)} иконок для обработки")

for png_file in png_files:
    try:
        # Открыть изображение
        img = Image.open(png_file)
        
        # Получить текущий размер
        width, height = img.size
        
        # Уменьшить на 15% (оставить 85%)
        new_width = int(width * 0.85)
        new_height = int(height * 0.85)
        
        # Изменить размер с высоким качеством
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Сохранить обратно
        resized_img.save(png_file, quality=95)
        
        print(f"✓ {png_file.name}: {width}x{height} → {new_width}x{new_height}")
    except Exception as e:
        print(f"✗ Ошибка при обработке {png_file.name}: {e}")

print("\nВсе иконки обработаны!")
