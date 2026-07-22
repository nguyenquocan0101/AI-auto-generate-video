import { formatTime, setText } from "../utils/dom.js";

export function setupSceneMedia(root) {
  root.querySelectorAll("[data-scene-video]").forEach((video) => {
    const card = video.closest(".scene-node");
    const id = card?.dataset.scene;
    const audio = card?.querySelector("[data-scene-audio]");
    const play = card?.querySelector(`[data-sync-play="${CSS.escape(id ?? "")}"]`);
    const time = card?.querySelector(`[data-audio-time="${CSS.escape(id ?? "")}"]`);
    const waveform = card?.querySelector(".audio-waveform");
    if (!id || !audio || !play || !time || !waveform) return;
    const sync = (force = false) => {
      if (force || Math.abs(audio.currentTime - video.currentTime) > 0.25) audio.currentTime = video.currentTime;
      setText(time, `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`);
      waveform.style.setProperty("--audio-progress", video.duration ? `${(video.currentTime / video.duration) * 100}%` : "0%");
    };
    const startAudio = () => { sync(true); audio.play().catch(() => {}); setText(play, "Ⅱ"); };
    video.addEventListener("play", startAudio);
    video.addEventListener("pause", () => { audio.pause(); setText(play, "▶"); });
    video.addEventListener("seeking", () => sync(true));
    video.addEventListener("timeupdate", () => sync());
    video.addEventListener("loadedmetadata", () => sync(true));
    video.addEventListener("ended", () => { audio.pause(); setText(play, "▶"); });
    play.addEventListener("click", () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
  });
}

