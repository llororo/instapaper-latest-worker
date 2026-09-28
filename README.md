# Instapaper Latest Worker

Worker de Cloudflare que consulta un perfil público de Instapaper e devolve o artigo favorito máis recente en formato JSON.

## Resposta

Unha solicitude `GET` a `/` ou `/instapaper-latest` devolve:

```json
{
  "title": "Título do artigo",
  "articleUrl": "https://example.org/artigo",
  "profileUrl": "https://www.instapaper.com/p/usuario"
}
```

## Configuración

Edita as variables de `wrangler.jsonc`:

- `INSTAPAPER_USERNAME`: usuario do perfil público de Instapaper;
- `ALLOWED_ORIGIN`: orixe autorizada para consultar o Worker, por exemplo `https://example.com`;
- `CACHE_TTL_SECONDS`: duración da caché en segundos, entre 0 e 3600.

Podes usar `*` como `ALLOWED_ORIGIN` se queres permitir solicitudes desde calquera web.

## Instalación e despregamento

Requírese Node.js e unha conta de Cloudflare.

```sh
npm install
npm test
npx wrangler login
npm run deploy
```

O código non usa credenciais de Instapaper. Só pode ler a información que o perfil ofrece publicamente.

## Limitacións

O funcionamento depende do endpoint público que usa actualmente Instapaper. Un cambio na súa estrutura ou nas súas condicións de acceso pode requirir unha actualización do Worker.

## Licenza

[MIT](LICENSE)
