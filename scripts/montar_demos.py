"""Copia as demos estáticas dos repositórios irmãos para site/demos/.

Uso: python scripts/montar_demos.py ../  (pasta que contém os clones)

O portal-libras recebe ajustes de texto na cópia: o protótipo original
imita a tela do SIGAA/UnB, e numa página pública fora da universidade
isso não deve parecer um login oficial. O repositório original não muda.
"""
import pathlib
import re
import shutil
import sys

RAIZ = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '..').resolve()
DESTINO = pathlib.Path(__file__).resolve().parent.parent / 'site' / 'demos'

ESTATICOS = {
    'agenda-pessoal': ['index.html', 'style.css', 'agenda.js'],
    'portal-libras': ['index.html', 'style.css', 'script.js'],
}

TROCAS_LIBRAS = [
    ('UnB · SIGAA Bilíngue — Portal Acessível Libras/Português', 'Portal Acadêmico Bilíngue (protótipo)'),
    ('UnB — SIGAA Bilíngue', 'Portal Acadêmico Bilíngue'),
    ('UnB <span', 'Portal <span'),
    ('| SIGAA Bilíngue', '| Bilíngue (protótipo)'),
    ('placeholder="Ex: 232005791"', 'placeholder="Qualquer valor (demonstração)"'),
    ('placeholder="Senha SIGAA"', 'placeholder="Qualquer senha (demonstração)"'),
    ('Entrar no SIGAA', 'Entrar na demonstração'),
    ('Universidade de Brasília &mdash; Acesso Inclusivo', 'Protótipo de acesso inclusivo'),
    ('Universidade de Brasília — Acesso Inclusivo', 'Protótipo de acesso inclusivo'),
    ('NATASHA OLIVEIRA SILVA', 'ESTUDANTE EXEMPLO'),
    ("'232005791'", "'000000000'"),
    ("'Estudante UnB'", "'Estudante Exemplo'"),
    ('defesas de TCC da UnB', 'defesas de TCC'),
    ('UnB · Transmissão ao vivo', 'Transmissão ao vivo'),
    ('Manual do Usuário — SIGAA Bilíngue', 'Manual do Usuário — Portal Bilíngue'),
    ('Sobre o Portal SIGAA Bilíngue', 'Sobre o Portal Bilíngue'),
    ('comunidade acadêmica da UnB', 'comunidade acadêmica'),
]
RE_RODAPE_APP = re.compile(r'Universidade de Brasília — Portal Bilíngue Libras/Português[^<\n]*')

RE_LINKS_LOGIN = re.compile(
    r'\s*<a href="https://sig\.unb\.br[^"]*"[^>]*>[^<]*</a>'
    r'|\s*<button class="login-sigaa-link"[^>]*>.*?</button>',
    re.S,
)
RE_RODAPE_LOGIN = re.compile(r'(<div class="unb-footer-login">).*?(</div>)', re.S)


def ajustar_libras(nome, texto):
    for antes, depois in TROCAS_LIBRAS:
        texto = texto.replace(antes, depois)
    if nome == 'index.html':
        texto = RE_LINKS_LOGIN.sub('', texto)
        texto = RE_RODAPE_LOGIN.sub(
            r'\1Protótipo acadêmico de acessibilidade Libras/Português. '
            r'Login simulado: nenhum dado é enviado.\2', texto)
        texto = RE_RODAPE_APP.sub('Protótipo acadêmico de portal bilíngue Libras/Português. Dados e números ilustrativos.', texto)
    if nome == 'script.js':
        texto = re.sub(r"window\.open\('https://sig\.unb\.br[^']*', '_blank'\);", '', texto)
    return texto


def main():
    for repo, arquivos in ESTATICOS.items():
        alvo = DESTINO / repo
        if alvo.exists():
            shutil.rmtree(alvo)
        alvo.mkdir(parents=True)
        for nome in arquivos:
            texto = (RAIZ / repo / nome).read_text(encoding='utf-8')
            if repo == 'portal-libras':
                texto = ajustar_libras(nome, texto)
            (alvo / nome).write_text(texto, encoding='utf-8', newline='')
        print('ok', repo)

    sobra = (DESTINO / 'portal-libras' / 'index.html').read_text(encoding='utf-8')
    sobra += (DESTINO / 'portal-libras' / 'script.js').read_text(encoding='utf-8')
    for termo in ('UnB', 'SIGAA', 'sig.unb', 'NATASHA', '232005791', 'Universidade de Bras'):
        if termo in sobra:
            print('ATENCAO: ainda aparece', termo)


if __name__ == '__main__':
    main()
