module.exports = {
  apps : [{
    name   : "collegiateaccount", // PM2에서 사용할 앱 이름
    script : "node_modules/next/dist/bin/next",
    // ⚠️ 수정: '-p 7000' 인자를 추가하여 포트 번호를 7000으로 설정합니다.
    args   : "start -p 7000",
    cwd    : "./", // 애플리케이션 디렉토리 (현재 폴더)
    watch  : false, // 파일 변경 감지 비활성화 (프로덕션에서는 보통 false)
    env    : {
      NODE_ENV: "production", // 환경 변수 설정
    }
  }]
}

