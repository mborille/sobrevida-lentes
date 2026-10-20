# Sobrevida de Lentes e Laminados (sobrevida-lentes)

Recebe os casos do próprio usuário (grupo, data da cimentação, data da falha ou da última revisão, falha sim ou não) e calcula a curva de Kaplan-Meier com intervalo de confiança de 95%, a sobrevida em 1, 2, 3, 5 e 10 anos, o seguimento mediano e a comparação entre grupos pelo teste log-rank. Tudo no navegador, sem enviar dados a servidor.

## Arquivos

- `sobrevida-lentes.html`: app de um arquivo só. Abra no navegador (computador ou celular).
- `nucleo/modelo.js`: leitura dos dados, Kaplan-Meier, intervalo log-log com variância de Greenwood, log-rank para 2 a 5 grupos e p-valor do qui-quadrado, em JavaScript puro.
- `nucleo/teste_modelo.js`: 17 testes. Rode com `node teste_modelo.js` dentro da pasta `nucleo`.

## Conferência dos métodos

Os testes usam o conjunto clássico de leucemia (6-MP contra placebo, Freireich 1963). Kaplan-Meier em 6, 7, 10, 13 e 23 semanas (0,857; 0,807; 0,753; 0,690; 0,448), a mediana (23 semanas) e o qui-quadrado do log-rank (16,8; p da ordem de 4e-5) batem com os valores publicados desse conjunto. O p-valor usa a gama incompleta, conferida nos pontos críticos 3,841 (1 gl) e 5,991 (2 gl).

## Formato dos dados

Uma linha por restauração: `grupo; início; fim; falha`. Datas em AAAA-MM-DD ou DD/MM/AAAA. Falha é 1 ou sim quando houve falha, 0 ou não quando segue sem falha. Fim em branco usa a data da análise. Tempo direto em meses: `grupo; 0; 18,5; 1`. Use códigos, nunca nomes de pacientes.

## Limites (declarar em qualquer publicação)

- Cada restauração é tratada como independente. Várias lentes do mesmo paciente são correlacionadas, e o app não corrige isso. Em estudo formal use modelo com fragilidade ou variância robusta por paciente.
- A análise supõe censura não informativa.
- Com poucos casos ou poucas falhas as curvas e o log-rank são instáveis, e o app avisa.
- O exemplo embutido é fictício, gerado por sorteio, e não representa nenhum material real.
- Ferramenta de estudo. Não substitui a análise por estatístico em um estudo formal.

## Licença

MIT. Veja `LICENSE`.

## Como citar

Veja `CITATION.cff`.

DOI: https://doi.org/10.6084/m9.figshare.34717038
