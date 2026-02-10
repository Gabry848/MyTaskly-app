import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Playback service per react-native-track-player.
 * Gestisce gli eventi remoti (notifiche, lockscreen, bluetooth).
 */
export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
};
