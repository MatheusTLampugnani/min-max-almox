#!/usr/bin/env bash
# Publica o Estoque Mín/Máx em /minmax/ no servidor, no mesmo padrão de rateios, visionstock etc.:
# container só em 127.0.0.1 + Nginx com login do Portal de Acesso (auth_request) + card na página inicial.
# Pode rodar de novo à vontade: o que já estiver feito é pulado.
#
# Antes: cadastre o sistema no portal (/acesso/ → Sistemas protegidos): código minmax, caminho /minmax/.
#
#   bash deploy/publicar-servidor.sh
set -euo pipefail

SITE=${SITE:-/etc/nginx/sites-available/imobilizados}
PORTAL=${PORTAL:-/var/www/portal/index.html}
SISTEMA=${SISTEMA:-minmax}
PORTA=${MINMAX_PORTA:-8096}
cd "$(dirname "$0")/.."

echo "== 1/4 Container (porta $PORTA só local)"
[ -f backend/.env ] || { echo "ERRO: falta backend/.env (copie de backend/.env.example)"; exit 1; }
chmod 600 backend/.env
if sudo ss -tln | grep -q ":$PORTA " && ! docker ps --format '{{.Names}} {{.Ports}}' | grep -q "videplast_estoque_mrp.*:$PORTA->"; then
  echo "ERRO: porta $PORTA já está em uso por outro serviço. Rode com MINMAX_PORTA=<outra> bash $0"; exit 1
fi
VITE_BASE_PATH=$SISTEMA MINMAX_PORTA=$PORTA docker compose up -d --build
for _ in $(seq 1 30); do curl -fs -o /dev/null "http://127.0.0.1:$PORTA/api/health" && break; sleep 2; done
curl -fs -o /dev/null "http://127.0.0.1:$PORTA/api/health" || { echo "ERRO: app não respondeu; veja: docker compose logs --tail 50"; exit 1; }
echo "  app OK em 127.0.0.1:$PORTA"

echo "== 2/4 Nginx: /$SISTEMA/ com login do portal"
if grep -q "location /$SISTEMA/ {" "$SITE"; then
  echo "  já estava configurado"
else
  grep -q "location ^~ /acesso/ {" "$SITE" || { echo "ERRO: Portal de Acesso não encontrado em $SITE"; exit 1; }
  sudo cp "$SITE" "$SITE.bak-$SISTEMA"
  # Insere o bloco logo antes do "location ^~ /acesso/ {"
  awk -v s="$SISTEMA" -v p="$PORTA" '
    $1 == "location" && $2 == "^~" && $3 == "/acesso/" && !feito {
      print "    location = /" s " { return 301 /" s "/; }"
      print "    location /" s "/ {"
      print "        auth_request /_acesso/" s ";"
      print "        error_page 401 = @acesso_entrar;"
      print "        error_page 403 = @acesso_negado;"
      print "        proxy_pass http://127.0.0.1:" p "/;"
      print "        proxy_set_header Host $host;"
      print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
      print "        proxy_set_header X-Forwarded-Proto $scheme;"
      print "        client_max_body_size 50m;"
      print "        proxy_read_timeout 300s;"
      print "    }"
      feito = 1
    }
    { print }' "$SITE.bak-$SISTEMA" > "/tmp/site-$SISTEMA.conf"
  sudo cp "/tmp/site-$SISTEMA.conf" "$SITE"
  if sudo nginx -t && sudo systemctl reload nginx; then
    echo "  OK (backup em $SITE.bak-$SISTEMA)"
  else
    sudo cp "$SITE.bak-$SISTEMA" "$SITE"; sudo systemctl reload nginx || true
    echo "FALHOU: Nginx restaurado do backup $SITE.bak-$SISTEMA"; exit 1
  fi
  sleep 2  # o reload do Nginx troca os processos aos poucos
fi

echo "== 3/4 Card na página inicial ($PORTAL)"
if grep -q "href=\"/$SISTEMA/\"" "$PORTAL"; then
  echo "  já estava na página"
else
  sudo cp "$PORTAL" "$PORTAL.bak-$SISTEMA"
  # Entra depois do último card (último </a> antes do rodapé); o /acesso/portal.js esconde de quem não tem acesso
  python3 - "$PORTAL" "/tmp/portal-$SISTEMA.html" "$SISTEMA" <<'PY'
import sys
origem, destino, s = sys.argv[1:4]
html = open(origem, encoding='utf-8').read()
card = f'''      <!-- Card 7: Estoque Mín/Máx (Almoxarifado) -->
      <a href="/{s}/" class="app-card">
        <div>
          <div class="card-top">
            <div class="icon-box" style="background: rgba(210,153,34,0.12); color: #d29922; border: 1px solid rgba(210,153,34,0.3);">
              <i class="bi bi-sliders"></i>
            </div>
            <span class="status-pill">
              <span class="status-dot"></span> Online • v1.0
            </span>
          </div>
          <h2 class="app-title">Estoque Mín/Máx</h2>
          <p class="app-desc">Parâmetros de estoque mínimo e máximo do almoxarifado, análise de distorção do MRP, solicitações de ajuste e histórico para a diretoria.</p>
        </div>
        <div class="btn-access">
          <span>Acessar Mín/Máx</span>
          <i class="bi bi-arrow-right"></i>
        </div>
      </a>'''
fim = html.index('<footer')
pos = html.rindex('</a>', 0, fim) + len('</a>')
open(destino, 'w', encoding='utf-8').write(html[:pos] + '\n\n' + card + html[pos:])
PY
  sudo cp "/tmp/portal-$SISTEMA.html" "$PORTAL"
  echo "  OK (backup em $PORTAL.bak-$SISTEMA)"
fi

echo "== 4/4 Conferência"
curl -s "http://127.0.0.1:$PORTA/" | grep -q "/$SISTEMA/assets/" \
  && echo "  build com subcaminho /$SISTEMA/ OK" \
  || echo "  AVISO: index.html não aponta para /$SISTEMA/assets/ (build sem VITE_BASE_PATH?)"
curl -s -o /dev/null -w "  /$SISTEMA/ sem login: %{http_code} (esperado 302 = pede login)\n" "http://127.0.0.1/$SISTEMA/"
curl -s "http://127.0.0.1/" | grep -q "href=\"/$SISTEMA/\"" && echo "  card na página inicial OK" || echo "  AVISO: card não apareceu na página inicial"
echo "Pronto: https://imobilizados.tailbba2c4.ts.net/$SISTEMA/ (no navegador, use Ctrl+F5 se ainda abrir o portal)"
