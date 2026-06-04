import ModeCard from "../components/ModeCard";

export default function Top() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink-900">
        お住まいの自治体で使える補助金を探します
      </h1>
      <p className="text-sm text-ink-700 mt-2">
        まずは検索方法を選んでください。子育て世帯向けの制度をご案内します。
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ModeCard
          to="/quick"
          icon="⚡"
          title="クイック検索"
          subtitle="2ステップで結果へ"
          description="お住まいの地域とテーマを選ぶだけで、対象の補助金一覧を素早く確認できます。"
        />
        <ModeCard
          to="/chat"
          icon="💬"
          title="じっくり相談"
          subtitle="チャットで深掘り"
          description="ご家族構成やご関心に合わせて、AIが質問しながら最適な制度を提案します。"
        />
      </div>

      <p className="mt-10 text-xs text-ink-500 leading-relaxed">
        ※ 本デモは関西電力 個人ユーザー向けの試作版です。表示内容はマイナポータルAPI（子育て支援レジストリー）に準拠予定で、現在は仮データで動作しています。
      </p>
    </div>
  );
}
