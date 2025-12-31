#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Читаем файл
with open('game/src/context/GameContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Старый блок кода
old_block = """const projectId = effect.projectId as string;
        setActiveProjects(prev => {
          const proj = prev.find(p => p.id === projectId);
          const remaining = prev.filter(p => p.id !== projectId);
          if (proj) {
              const failed = { ...proj, completedDate: Date.now(), success: false, likes: 0, dislikes: 0, comments: [], cancelledByEvent: true } as Project;
            setCompletedProjects(prevC => {
              const toAdd = [failed].filter(f => !prevC.some(p => p.id === f.id));
              const updated = [...prevC, ...toAdd];
              localStorage.setItem('completedProjects', JSON.stringify(updated));
              return updated;
            });
            // Show a single project-cancellation event popup (rename: Отмена проекта)
            try {
              showEventIfIdle && showEventIfIdle({ id: `project_cancelled_${Date.now()}`, type: 'bad', title: 'Отмена проекта', text: `Проект "${proj.name}" отменён: вы не посещали занятия и прогресс потерян.`, effect: {} });
            } catch (e) {
              // ignore if showEventIfIdle not available
            }
          }
          return remaining;
        });"""

new_block = """const projectId = effect.projectId as string;
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
      }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('game/src/context/GameContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('✓ File updated successfully!')
else:
    print('✗ Could not find the target block')
    print('Searching for partial match...')
    if 'const projectId = effect.projectId as string;' in content:
        print('  ✓ Found projectId assignment')
    if 'setActiveProjects(prev => {' in content:
        print('  ✓ Found setActiveProjects')

