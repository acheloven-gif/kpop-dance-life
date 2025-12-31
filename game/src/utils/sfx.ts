export function playSFX(name: string) {
  try {
    // Respect global mute flag stored in sessionStorage by AudioManager
    const muted = sessionStorage.getItem('isMuted');
    if (muted === 'true') return;
    const audio = new Audio(`/sounds/${name}`);
    // Получаем SFX громкость из sessionStorage или используем default 0.7
    const sfxVolume = parseFloat(sessionStorage.getItem('currentSFXVolume') || '0.7');
    audio.volume = sfxVolume * 0.8; // 0.8 - базовая громкость, умножается на пользовательский volume
    audio.play().catch(() => {
      // Если файл отсутствует или автоплей заблокирован, пробуем короткий тон через WebAudio
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 800;
        g.gain.value = 0.02 * sfxVolume;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 120);
      } catch (e) {
        // noop
      }
    });
  } catch (e) {
    try {
      const sfxVolume = parseFloat(sessionStorage.getItem('currentSFXVolume') || '0.7');
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 800;
      g.gain.value = 0.02 * sfxVolume;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 120);
    } catch (e) {
      // noop
    }
  }
}

export default playSFX;
