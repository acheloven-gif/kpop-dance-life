#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Читаем файл
with open('game/src/context/GameContext.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Новый код
new_lines_content = """      const projectId = effect.projectId as string;
      const proj = activeProjects.find(p => p.id === projectId);
      if (proj) {
        const failed = { ...proj, completedDate: Date.now(), success: false, likes: 0, dislikes: 0, comments: [], cancelledByEvent: true } as Project;
        
        // Update activeProjects to remove cancelled project
        setActiveProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Update completedProjects with cancelled project (separate setState)
        setCompletedProjects(prevC => {
          const toAdd = [failed].filter(f => !prevC.some(p => p.id === f.id));
          const updated = [...prevC, ...toAdd];
          localStorage.setItem('completedProjects', JSON.stringify(updated));
          return updated;
        });
        
        // Show a single project-cancellation event popup
        try {
          showEventIfIdle && showEventIfIdle({ id: `project_cancelled_${Date.now()}`, type: 'bad', title: 'Отмена проекта', text: `Проект "${proj.name}" отменён: вы не посещали занятия и прогресс потерян.`, effect: {} });
        } catch (e) {
          // ignore if showEventIfIdle not available
        }
      }
"""

# Индексы (0-based): строки 1039-1059 это индексы 1038-1058 в списке (21 строка)
# Вставляем новый код и удаляем старый
new_file_lines = lines[:1038] + [new_lines_content + '\n'] + lines[1059:]

# Записываем
with open('game/src/context/GameContext.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_file_lines)

print('✓ File updated successfully!')
print('Replaced lines 1039-1059 with new optimized code')
