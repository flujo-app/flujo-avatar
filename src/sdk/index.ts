'use client';
export * from '../index.js';
export { WorldScene } from '../world/index.js';
export type { WorldSceneProps, AvatarWorldSnapshot, AvatarWorldObject } from '../world/index.js';
export { useNativeRouterVoice } from '../client/useNativeRouterVoice.js';
export type NativeVoiceOptions = Parameters<typeof import('../client/useNativeRouterVoice.js').useNativeRouterVoice>[0];
export { voiceHeaders, snapshotNativeVoiceTransport, localNativeVoiceTransport } from '../client/nativeVoiceTransport.js';
export { DEFAULT_LOCALE, normalizeLocale } from '../client/locale.js';
export type { Locale } from '../client/locale.js';
