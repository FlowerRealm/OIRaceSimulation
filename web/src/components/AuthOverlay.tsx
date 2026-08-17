import { Overlay } from './Overlay';

export interface AuthOverlayProps {
  hidden?: boolean;
  /** Login and register share the dialog; only the labels differ. */
  mode?: 'login' | 'register';
  error?: string;
}

/** Account gate. It is the only overlay visible on first paint. */
export function AuthOverlay({ hidden = false, mode = 'login', error = '' }: AuthOverlayProps) {
  return (
    <Overlay id="authOverlay" hidden={hidden}>
      <h2>OI 比赛模拟器</h2>
      <p style={{ color: '#888', fontSize: '.85rem', marginBottom: 12 }}>
        登录后开始，成绩与成就保存在你的账号里
      </p>
      <input
        type="text"
        className="name-input"
        id="authUsername"
        placeholder="用户名（1-16 字符）"
        maxLength={16}
        autoComplete="username"
      />
      <input
        type="password"
        className="name-input"
        id="authPassword"
        placeholder="密码（至少 6 位）"
        maxLength={128}
        autoComplete="current-password"
      />
      <div className="name-error" id="authError">
        {error}
      </div>
      <button className="btn-start-game" id="btnAuthSubmit">
        {mode === 'login' ? '登录' : '注册'}
      </button>
      <button className="btn-challenge-open" id="btnAuthToggle">
        {mode === 'login' ? '没有账号？注册一个' : '已有账号？去登录'}
      </button>
    </Overlay>
  );
}
