import ModeCard from "../components/ModeCard";

export default function Top() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink-900">
        関西電力 暮らしサポートAI（テスト）
      </h1>
      <p className="text-sm text-ink-700 mt-2">
        日常のお困りごとを、AI がお手伝いします。ご利用になりたいサービスをお選びください。
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* 利用可能なAI */}
        <ModeCard
          to="/childcare"
          icon="🌱"
          title="子育て補助金相談AI"
          subtitle="自治体ごとの支援制度をご案内"
          description="マイナポータル連携で、お住まいの自治体で使える子育て支援補助金・手当をAIが提案します。"
          status="利用可能"
        />

        {/* サンプル: 準備中（マイナポータルAPI 連携の他カテゴリを想定） */}
        <ModeCard
          icon="🤝"
          title="介護給付サーチAI"
          subtitle="介護保険・要介護認定をご案内"
          description="ご家族の状況に合わせて、お住まいの自治体の介護給付・要介護認定・介護予防の手続きをご案内します。"
          disabled
          status="準備中"
        />

        <ModeCard
          icon="📦"
          title="引越し手続きナビAI"
          subtitle="転入・転出・各種届出をサポート"
          description="お引越しに必要な転入届・転出届・住所変更・転校手続きを、自治体ごとに整理してご案内します。"
          disabled
          status="準備中"
        />

        <ModeCard
          icon="🏥"
          title="健康・医療サポートAI"
          subtitle="健診・予防接種・医療費助成"
          description="健康診断、予防接種、医療費助成、難病医療費助成など、お住まいの自治体の医療関連制度をご案内します。"
          disabled
          status="準備中"
        />
      </div>

      <p className="mt-10 text-xs text-ink-500 leading-relaxed">
        ※ 本サービスは関西電力 個人ユーザー向けの試作版（テスト）です。現在ご利用いただけるのは「子育て補助金相談AI」のみで、その他のサービスは順次追加予定です。
      </p>
    </div>
  );
}
