export interface SubscriptionPreset {
  key: string;
  name: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  categoryHint: string;
  icon: string;
  color: string;
}

export const subscriptionPresets: SubscriptionPreset[] = [
  // --- 動画配信 ---
  { key: "netflix-basic", name: "Netflix ベーシック", amount: 990, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#E50914" },
  { key: "netflix-standard", name: "Netflix スタンダード", amount: 1590, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#E50914" },
  { key: "netflix-premium", name: "Netflix プレミアム", amount: 2290, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#E50914" },
  { key: "amazon-prime-monthly", name: "Amazon Prime（月額）", amount: 600, billingCycle: "monthly", categoryHint: "エンタメ", icon: "ShoppingBag", color: "#FF9900" },
  { key: "amazon-prime-yearly", name: "Amazon Prime（年額）", amount: 5900, billingCycle: "yearly", categoryHint: "エンタメ", icon: "ShoppingBag", color: "#FF9900" },
  { key: "disney-standard", name: "Disney+ スタンダード", amount: 990, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#113CCF" },
  { key: "disney-premium", name: "Disney+ プレミアム", amount: 1320, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#113CCF" },
  { key: "hulu", name: "Hulu", amount: 1026, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#1CE783" },
  { key: "u-next", name: "U-NEXT", amount: 2189, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#120A8F" },
  { key: "dazn", name: "DAZN", amount: 4200, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#F8F8F5" },
  { key: "abema-premium", name: "ABEMAプレミアム", amount: 960, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#00B140" },
  { key: "danimestore", name: "dアニメストア", amount: 550, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#FF6B00" },
  { key: "crunchyroll", name: "Crunchyroll", amount: 790, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Tv", color: "#F47521" },

  // --- 音楽 ---
  { key: "spotify", name: "Spotify Premium", amount: 980, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Music", color: "#1DB954" },
  { key: "apple-music", name: "Apple Music", amount: 1080, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Music", color: "#FA243C" },
  { key: "youtube-premium", name: "YouTube Premium", amount: 1280, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Youtube", color: "#FF0000" },
  { key: "amazon-music", name: "Amazon Music Unlimited", amount: 1080, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Music", color: "#25D1DA" },
  { key: "line-music", name: "LINE MUSIC", amount: 980, billingCycle: "monthly", categoryHint: "エンタメ", icon: "Music", color: "#06C755" },

  // --- クラウド・ストレージ ---
  { key: "icloud-50gb", name: "iCloud+ 50GB", amount: 130, billingCycle: "monthly", categoryHint: "デジタル", icon: "Cloud", color: "#3693F3" },
  { key: "icloud-200gb", name: "iCloud+ 200GB", amount: 400, billingCycle: "monthly", categoryHint: "デジタル", icon: "Cloud", color: "#3693F3" },
  { key: "icloud-2tb", name: "iCloud+ 2TB", amount: 1300, billingCycle: "monthly", categoryHint: "デジタル", icon: "Cloud", color: "#3693F3" },
  { key: "google-one-100gb", name: "Google One 100GB", amount: 250, billingCycle: "monthly", categoryHint: "デジタル", icon: "Cloud", color: "#4285F4" },
  { key: "google-one-2tb", name: "Google One 2TB", amount: 1300, billingCycle: "monthly", categoryHint: "デジタル", icon: "Cloud", color: "#4285F4" },
  { key: "dropbox-plus", name: "Dropbox Plus", amount: 1500, billingCycle: "monthly", categoryHint: "デジタル", icon: "Cloud", color: "#0061FF" },
  { key: "ms365-personal", name: "Microsoft 365 Personal", amount: 1490, billingCycle: "monthly", categoryHint: "デジタル", icon: "Monitor", color: "#D83B01" },

  // --- ゲーム ---
  { key: "switch-online", name: "Nintendo Switch Online", amount: 2400, billingCycle: "yearly", categoryHint: "ゲーム", icon: "Gamepad2", color: "#E60012" },
  { key: "switch-online-plus", name: "Nintendo Switch Online + 追加パック", amount: 4900, billingCycle: "yearly", categoryHint: "ゲーム", icon: "Gamepad2", color: "#E60012" },
  { key: "ps-plus-essential", name: "PlayStation Plus Essential", amount: 6800, billingCycle: "yearly", categoryHint: "ゲーム", icon: "Gamepad2", color: "#003791" },
  { key: "ps-plus-extra", name: "PlayStation Plus Extra", amount: 11700, billingCycle: "yearly", categoryHint: "ゲーム", icon: "Gamepad2", color: "#003791" },
  { key: "xbox-gamepass-core", name: "Xbox Game Pass Core", amount: 5480, billingCycle: "yearly", categoryHint: "ゲーム", icon: "Gamepad2", color: "#107C10" },
  { key: "xbox-gamepass-ultimate", name: "Xbox Game Pass Ultimate", amount: 1450, billingCycle: "monthly", categoryHint: "ゲーム", icon: "Gamepad2", color: "#107C10" },

  // --- AI・開発ツール ---
  { key: "chatgpt-plus", name: "ChatGPT Plus", amount: 3000, billingCycle: "monthly", categoryHint: "デジタル", icon: "Bot", color: "#10A37F" },
  { key: "chatgpt-pro", name: "ChatGPT Pro", amount: 30000, billingCycle: "monthly", categoryHint: "デジタル", icon: "Bot", color: "#10A37F" },
  { key: "claude-pro", name: "Claude Pro", amount: 3000, billingCycle: "monthly", categoryHint: "デジタル", icon: "Bot", color: "#D4A27F" },
  { key: "github-copilot", name: "GitHub Copilot", amount: 1500, billingCycle: "monthly", categoryHint: "デジタル", icon: "Code", color: "#24292F" },
  { key: "notion-plus", name: "Notion Plus", amount: 1650, billingCycle: "monthly", categoryHint: "デジタル", icon: "FileText", color: "#000000" },
  { key: "1password", name: "1Password", amount: 430, billingCycle: "monthly", categoryHint: "デジタル", icon: "Lock", color: "#1A8CFF" },
  { key: "adobe-cc", name: "Adobe Creative Cloud", amount: 7780, billingCycle: "monthly", categoryHint: "デジタル", icon: "Palette", color: "#FF0000" },

  // --- 通信・生活 ---
  { key: "nhk-terrestrial", name: "NHK受信料（地上）", amount: 1100, billingCycle: "monthly", categoryHint: "生活", icon: "Radio", color: "#005BAC" },
  { key: "nhk-satellite", name: "NHK受信料（衛星）", amount: 1950, billingCycle: "monthly", categoryHint: "生活", icon: "Radio", color: "#005BAC" },

  // --- フィットネス ---
  { key: "apple-fitness", name: "Apple Fitness+", amount: 1200, billingCycle: "monthly", categoryHint: "健康", icon: "Heart", color: "#FA2D55" },
];

/** プリセットをカテゴリヒントでグループ化 */
export function groupPresetsByCategory(
  presets: SubscriptionPreset[],
): Record<string, SubscriptionPreset[]> {
  const groups: Record<string, SubscriptionPreset[]> = {};
  for (const p of presets) {
    const group = groups[p.categoryHint] ?? [];
    group.push(p);
    groups[p.categoryHint] = group;
  }
  return groups;
}
