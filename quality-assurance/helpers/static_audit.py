from __future__ import annotations

from pathlib import Path
import json
import re
from typing import Iterable

REPO_MARKERS = (
    'backend/Ecom.Api/Program.cs',
    'frontend/ecom-ui/src/app',
)

KNOWN_FILE_PATTERNS = {
    'orders_controller': ['backend/Ecom.Api/Controllers/OrdersController.cs', '*/OrdersController.cs', 'OrdersController.cs'],
    'categories_controller': ['backend/Ecom.Api/Controllers/CategoriesController.cs', '*/CategoriesController.cs', 'CategoriesController.cs'],
    'subcategories_controller': ['backend/Ecom.Api/Controllers/SubCategoriesController.cs', '*/SubCategoriesController.cs', 'SubCategoriesController.cs'],
    'products_controller': ['backend/Ecom.Api/Controllers/ProductsController.cs', '*/ProductsController.cs', 'ProductsController.cs'],
    'cart_service': ['frontend/ecom-ui/src/app/core/services/cart.service.ts', '*/cart.service.ts', 'cart.service.ts'],
    'program': ['backend/Ecom.Api/Program.cs', '*/Program.cs', 'Program.cs'],
    'appsettings': ['backend/Ecom.Api/appsettings.json', '*/appsettings.json', 'appsettings.json'],
    'login_html': ['frontend/ecom-ui/src/app/pages/login/login.component.html', '*/login.component.html', 'login.component.html'],
    'navbar_html': ['frontend/ecom-ui/src/app/shared/navbar/navbar.component.html', '*/navbar.component.html', 'navbar.component.html'],
    'products_html': ['frontend/ecom-ui/src/app/pages/products/products.component.html', '*/products.component.html', 'products.component.html'],
    'cart_html': ['frontend/ecom-ui/src/app/pages/cart/cart.component.html', '*/cart.component.html', 'cart.component.html'],
}

SELECTOR_ATTRS = ('data-testid', 'data-test', 'data-cy', 'data-qa')


def _candidate_roots(seed: Path) -> list[Path]:
    seeds = [seed]
    try:
        seeds.append(Path.cwd())
    except Exception:
        pass
    roots: list[Path] = []
    seen = set()
    for base in seeds:
        current = base.resolve()
        for candidate in [current, *current.parents]:
            if candidate not in seen:
                seen.add(candidate)
                roots.append(candidate)
            # also inspect sibling directories next to likely workspace roots
            try:
                for child in candidate.iterdir():
                    if child.is_dir() and child not in seen:
                        seen.add(child)
                        roots.append(child)
            except Exception:
                pass
    return roots


def is_source_root(path: Path) -> bool:
    if not path.exists() or not path.is_dir():
        return False
    for marker in REPO_MARKERS:
        if (path / marker).exists():
            return True
    # relaxed discovery: one backend marker and one frontend marker anywhere under this root
    has_program = any(path.rglob('Program.cs'))
    has_app_html = any(path.rglob('*.component.html'))
    return has_program and has_app_html


def discover_source_root(seed: Path) -> Path:
    for candidate in _candidate_roots(seed):
        if is_source_root(candidate):
            return candidate
    return seed.parent


def _rank_match(path: Path, pattern: str) -> tuple[int, int, str]:
    suffix = pattern.replace('*/', '')
    suffix_penalty = 0 if str(path).replace('\\', '/').endswith(suffix) else 1
    return (suffix_penalty, len(path.parts), str(path))


def find_known_file(source_root: Path, key: str) -> Path | None:
    patterns = KNOWN_FILE_PATTERNS[key]
    for pattern in patterns:
        direct = source_root / pattern
        if '*' not in pattern and direct.exists():
            return direct
        matches = [p for p in source_root.rglob(pattern.replace('*/', '')) if p.is_file()]
        if matches:
            return sorted(matches, key=lambda p: _rank_match(p, pattern))[0]
    return None


def require_known_file(source_root: Path, key: str) -> Path:
    path = find_known_file(source_root, key)
    if path is None:
        raise FileNotFoundError(f'Could not find required source file for {key!r} under {source_root}')
    return path


def read_known_file(source_root: Path, key: str) -> str:
    return require_known_file(source_root, key).read_text(encoding='utf-8')


def looks_like_stock_decrement_logic(text: str) -> bool:
    patterns = [
        r'\.StockQty\s*-=',
        r'\.StockQty\s*=\s*[^;\n]*\.StockQty\s*-',
        r'\.StockQty\s*=\s*[^;\n]*-\s*(?:i|item)\.Qty',
        r'\.StockQty\s*=\s*[^;\n]*-\s*qty',
    ]
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)


def looks_like_cart_stock_cap(text: str) -> bool:
    patterns = [
        r'Math\.min\s*\(\s*(?:q|qty|quantity)\s*,\s*[^\n;]*stock',
        r'(?:q|qty|quantity)\s*=\s*Math\.min\s*\([^\n;]*stock',
        r'(?:if\s*\([^\)]*(?:q|qty|quantity)\s*>\s*[^\n;]*stock[^\)]*\)[^\n;{]*\{?\s*(?:q|qty|quantity)\s*=\s*[^\n;]*stock)',
        r'setQty[\s\S]{0,300}Math\.min',
    ]
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)


def looks_like_conflict_handling(text: str) -> bool:
    has_db_exception = 'DbUpdateException' in text or 'DbUpdateConcurrencyException' in text
    conflict_patterns = [
        r'\bConflict\s*\(',
        r'StatusCode\s*\(\s*409\s*[,)]',
        r'Problem\s*\([^\)]*statusCode\s*:\s*409',
        r'ConflictObjectResult',
    ]
    has_conflict = any(re.search(pattern, text, re.IGNORECASE | re.DOTALL) for pattern in conflict_patterns)
    return has_db_exception and has_conflict


def selector_attr_present(text: str) -> bool:
    lowered = text.lower()
    return any(f'{attr}=' in lowered for attr in SELECTOR_ATTRS)


def img_tag_is_accessible(tag: str) -> bool:
    lowered = tag.lower()
    if 'alt=' in lowered or '[alt]=' in lowered:
        return True
    if 'aria-hidden="true"' in lowered or "aria-hidden='true'" in lowered:
        return True
    if 'role="presentation"' in lowered or "role='presentation'" in lowered:
        return True
    return False


def find_app_root(source_root: Path) -> Path | None:
    for candidate in [source_root / 'frontend/ecom-ui/src/app', *source_root.rglob('src/app')]:
        if candidate.exists() and candidate.is_dir():
            return candidate
    return None


def find_html_files(source_root: Path) -> list[Path]:
    app_root = find_app_root(source_root)
    if app_root is None:
        return []
    return list(app_root.rglob('*.html'))


def missing_accessible_images(html_files: Iterable[Path], source_root: Path) -> list[str]:
    missing = []
    img_pattern = re.compile(r'<img[^>]*>', re.IGNORECASE)
    for html in html_files:
        txt = html.read_text(encoding='utf-8')
        for tag in img_pattern.findall(txt):
            if not img_tag_is_accessible(tag):
                try:
                    missing.append(str(html.relative_to(source_root)).replace('\\', '/'))
                except Exception:
                    missing.append(str(html).replace('\\', '/'))
                break
    return missing


def run_static_audit(source_root: Path) -> dict:
    source_root = discover_source_root(source_root)
    warnings = []
    fixed = []
    coverage = {'cs': 0, 'ts': 0, 'html': 0}

    for path in source_root.rglob('*'):
        if path.suffix == '.cs':
            coverage['cs'] += 1
        elif path.suffix == '.ts':
            coverage['ts'] += 1
        elif path.suffix == '.html':
            coverage['html'] += 1

    try:
        program = read_known_file(source_root, 'program')
    except FileNotFoundError:
        program = ''
    try:
        appsettings = read_known_file(source_root, 'appsettings')
    except FileNotFoundError:
        appsettings = ''
    try:
        orders = read_known_file(source_root, 'orders_controller')
    except FileNotFoundError:
        orders = ''
    try:
        cart = read_known_file(source_root, 'cart_service')
    except FileNotFoundError:
        cart = ''
    try:
        categories = read_known_file(source_root, 'categories_controller')
    except FileNotFoundError:
        categories = ''
    try:
        subcategories = read_known_file(source_root, 'subcategories_controller')
    except FileNotFoundError:
        subcategories = ''
    try:
        products = read_known_file(source_root, 'products_controller')
    except FileNotFoundError:
        products = ''

    if orders and looks_like_stock_decrement_logic(orders):
        fixed.append('Stock is decremented when an order is created.')
    else:
        warnings.append('Order creation does not visibly decrement stock in OrdersController.')

    if cart and looks_like_cart_stock_cap(cart):
        fixed.append('Cart manual quantity updates are capped by stock quantity.')
    else:
        warnings.append('Cart setQty does not cap the quantity to available stock.')

    if categories and looks_like_conflict_handling(categories):
        fixed.append('Category delete action returns Conflict instead of a raw database failure.')
    else:
        warnings.append('Category delete action does not appear to handle foreign-key conflicts.')

    if subcategories and looks_like_conflict_handling(subcategories):
        fixed.append('Subcategory delete action returns Conflict instead of a raw database failure.')
    else:
        warnings.append('Subcategory delete action does not appear to handle foreign-key conflicts.')

    if products and looks_like_conflict_handling(products):
        fixed.append('Product delete action returns Conflict instead of a raw database failure.')
    else:
        warnings.append('Product delete action does not appear to handle foreign-key conflicts.')

    if program and 'SetIsOriginAllowed(_ => true)' in program:
        warnings.append('CORS policy allows every origin in development configuration.')

    if appsettings and 'C:\\images\\product' in appsettings:
        warnings.append('Product image storage uses an absolute Windows path that reduces portability.')

    if appsettings and ('Admin123!' in appsettings or 'ThisIsADevSecretKey' in appsettings):
        warnings.append('Development secrets are hardcoded in appsettings.json and must be changed outside local use.')

    if program and program.count('SeedAdmin') > 0 and 'DbSeeder.SeedAsync' in program:
        warnings.append('Program.cs contains extra seed logic after DbSeeder.SeedAsync; this is acceptable in dev but redundant.')

    key_files = [
        find_known_file(source_root, 'login_html'),
        find_known_file(source_root, 'navbar_html'),
        find_known_file(source_root, 'products_html'),
        find_known_file(source_root, 'cart_html'),
    ]
    resolved_key_files = [p for p in key_files if p is not None]
    if resolved_key_files and all(selector_attr_present(p.read_text(encoding='utf-8')) for p in resolved_key_files):
        fixed.append('Stable data-testid selectors were added to key pages for Selenium automation.')
    else:
        warnings.append('Some key pages still lack stable selectors for automation.')

    html_files = find_html_files(source_root)
    missing_alt = missing_accessible_images(html_files, source_root) if html_files else []
    if html_files and not missing_alt:
        fixed.append('Image tags in Angular templates include alt text in the scanned pages.')
    elif html_files:
        warnings.append('Some image tags are missing alt text: ' + ', '.join(sorted(missing_alt)[:5]))
    else:
        warnings.append('Angular HTML templates were not found for the accessibility scan.')

    report = {
        'source_root': str(source_root),
        'coverage': coverage,
        'fixed': fixed,
        'warnings': warnings,
        'warning_count': len(warnings),
        'fixed_count': len(fixed),
    }
    return report


def write_reports(source_root: Path, output_dir: Path) -> dict:
    report = run_static_audit(source_root)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'static_audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    lines = [
        '# Static analysis report',
        '',
        f"Source root: `{report['source_root']}`",
        '',
        '## Coverage scanned',
        f"- C# files: {report['coverage']['cs']}",
        f"- TypeScript files: {report['coverage']['ts']}",
        f"- HTML files: {report['coverage']['html']}",
        '',
        '## Corrected or confirmed improvements',
    ]
    lines += [f'- {item}' for item in report['fixed']] or ['- None captured']
    lines += ['', '## Remaining warnings']
    lines += [f'- {item}' for item in report['warnings']] or ['- None']
    (output_dir / 'static_audit.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return report
