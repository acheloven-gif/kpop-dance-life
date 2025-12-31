#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Читаем файл
with open('game/src/context/GameContext.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Новый код - строки которые заменяем
new_code_lines = [
    "      const projectId = effect.projectId as string;\n",
    "      const proj = activeProjects.find(p => p.id === projectId);\n",
    "      if (proj) {\n",
    "        const failed = { ...proj, completedDate: Date.now(), success: false, likes: 0, dislikes: 0, comments: [], cancelledByEvent: true } as Project;\n",
    "        \n",
    "        // Update activeProjects to remove cancelled project\n",
    "        setActiveProjects(prev => prev.filter(p => p.id !== projectId));\n",
    "        \n",
    "        // Update completedProjects with cancelled project (separate setState)\n",
    "        setCompletedProjects(prevC => {\n",
    "          const toAdd = [failed].filter(f => !prevC.some(p => p.id === f.id));\n",
    "          const updated = [...prevC, ...toAdd];\n",
    "          localStorage.setItem('completedProjects', JSON.stringify(updated));\n",
    "          return updated;\n",
    "        });\n",
    "        \n",
    "        // Show a single project-cancellation event popup\n",
    "        try {\n",
    "          showEventIfIdle && showEventIfIdle({ id: `project_cancelled_${Date.now()}`, type: 'bad', title: 'Отмена проекта', text: `Проект \"${proj.name}\" отменён: вы не посещали занятия и прогресс потерян.`, effect: {} });\n",
    "        } catch (e) {\n",
    "          // ignore if showEventIfIdle not available\n",
    "        }\n",
    "      }\n",
]

# Индексы: 0-based: линии 1038-1058 (21 строка)
# Заменяем строки с индексом 1038 по 1058 включительно
new_file_lines = lines[:1038] + new_code_lines + lines[1059:]

# Записываем
with open('game/src/context/GameContext.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_file_lines)

print('✓ File updated successfully!')
print('Replaced lines 1039-1059 (21 lines)')
print('New code:')
print('  - Separated setActiveProjects and setCompletedProjects')
print('  - Fixed async issues')
print('  - Fixed Russian text encoding')
