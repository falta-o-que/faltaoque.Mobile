# Spike técnico — NFC-e de São Paulo

Status: registro histórico do spike/protótipo técnico. A extração atual e a revisão estão implementadas no app local, mas a leitura real e o fluxo completo ainda precisam de validação física no Android.

Nota: este spike registra a estratégia técnica original. Para o fluxo atual, a identidade da NFC-e é o código entre `p=` e o primeiro `|` do link do QR Code, correspondente a `purchases.qr_code_id`, com duplicidade verificada por despensa. A impressão digital SHA-256 abaixo descreve apenas o experimento/protótipo anterior e não deve ser usada como identidade do fluxo atual.

## Objetivo

Comprovar no Android físico que o aplicativo consegue ler o QR Code de uma NFC-e paulista, abrir ou consultar sua página pública e transformar os dados em um modelo fiscal normalizado, sem backend.

O spike não deve alterar despensas nem produtos. Seu resultado é uma decisão técnica baseada em evidência.

## Amostra necessária

- Conteúdo textual completo de ao menos um QR Code real de NFC-e de São Paulo, preferencialmente recente.
- Se possível, uma segunda nota de outro estabelecimento para detectar diferenças de marcação.
- A amostra não deve ser incluída no Git nem aparecer em logs persistentes.

## Estratégia em ordem

1. Ler QR Codes com `expo-camera` e aceitar somente protocolos HTTPS e domínios fiscais conhecidos.
2. Identificar o estado pela URL e encaminhar para o extrator `sp`.
3. Tentar obter a página com `fetch`, aplicando timeout, limite de tamanho e tratamento de redirecionamento.
4. Se o HTML retornado não contiver os dados, abrir a URL em uma `WebView` isolada e extrair somente o resultado normalizado por JavaScript injetado e `postMessage`.
5. Converter a resposta para um modelo fiscal independente da estrutura da SEFAZ.
6. Gerar uma impressão digital SHA-256 a partir do conteúdo canônico do QR Code.

## Modelo normalizado mínimo

```text
purchase: {
  purchasedAt,
  merchantName,
  totalAmount,
  qrCodeId,
  items: [{
    sourceDescription,
    quantity,
    unitLabel,
    unitPrice,
    totalPrice
  }]
}
```

Neste registro, `qrCodeId` é o trecho do parâmetro `p` entre `p=` e o primeiro `|`. O protótipo antigo usava `qrFingerprint`; esse identificador foi substituído e não deve voltar ao fluxo atual.

Campos ausentes devem ser representados explicitamente como indisponíveis; o extrator não pode inventar valores.

## Critérios de sucesso

- A câmera lê o QR Code uma única vez e interrompe novas leituras enquanto processa.
- Uma nota válida retorna estabelecimento, data, total e itens suficientes para a tela de revisão.
- Quantidades e valores monetários brasileiros são convertidos sem perda por separadores de milhar e decimal.
- A impressão digital é estável para o mesmo QR Code.
- Falha de rede, HTML inesperado, QR inválido, página expirada ou desafio de segurança produz erro controlado.
- Nenhuma conta, produto, despensa ou compra é gravada durante o spike.

## Segurança e privacidade

- Não registrar URL completa, chave fiscal, cookies nem HTML da nota em logs.
- Bloquear navegação da `WebView` para destinos não autorizados.
- Não permitir execução de conteúdo fiscal fora da tela isolada do spike.
- Remover dados brutos da memória assim que a normalização terminar.

## Decisão ao final

Registrar qual alternativa funcionou (`fetch`, `WebView` ou combinação), seletores ou heurísticas frágeis, cobertura obtida e limitações encontradas. Se a SEFAZ exigir CAPTCHA ou bloquear o processamento no aparelho, interromper a implementação produtiva e reavaliar o requisito com a equipe antes de criar contornos inseguros.
