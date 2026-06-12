import { Link } from "react-router-dom";
import ModeCard from "../components/ModeCard";

export default function ChildcareTop() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/" className="text-sm text-ink-500 hover:text-ink-900">
        ← AI 一覧に戻る
      </Link>

      <h1 className="text-2xl font-semibold text-ink-900 mt-3">
        🌱 子育て補助金相談AI
      </h1>
      <p className="text-sm text-ink-700 mt-2">
        お住まいの自治体で使える子育て支援補助金を探します。検索方法をお選びください。
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
        ※ 本サービスはマイナポータルAPI（外部連携制度・手続検索）に接続し、自治体が公開している子育て支援制度の実データを表示します。
        現在は検証環境に接続しているため、自治体によってデータが揃っていない場合があります。
      </p>
    </div>
  );
}
