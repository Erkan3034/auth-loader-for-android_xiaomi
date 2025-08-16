"""Command-line interface for Xiaomi Unlock Client."""

import sys
import time
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
    from rich.prompt import Prompt, Confirm
    from rich.text import Text
    from rich.align import Align
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from colorama import init, Fore, Style, Back

# Initialize colorama
init(autoreset=True)


class CLI:
    """Command-line interface handler."""
    
    def __init__(self, no_color: bool = False, quiet: bool = False):
        self.no_color = no_color
        self.quiet = quiet
        
        if RICH_AVAILABLE and not no_color:
            self.console = Console()
            self.use_rich = True
        else:
            self.console = None
            self.use_rich = False
    
    def info(self, message: str, end: str = "\n"):
        """Display info message."""
        if self.quiet:
            return
        
        if self.use_rich:
            self.console.print(f"[blue]ℹ[/blue] {message}", end=end)
        else:
            color = "" if self.no_color else Fore.BLUE
            print(f"{color}ℹ {message}{Style.RESET_ALL}", end=end)
    
    def success(self, message: str, end: str = "\n"):
        """Display success message."""
        if self.use_rich:
            self.console.print(f"[green]✓[/green] {message}", end=end)
        else:
            color = "" if self.no_color else Fore.GREEN
            print(f"{color}✓ {message}{Style.RESET_ALL}", end=end)
    
    def warning(self, message: str, end: str = "\n"):
        """Display warning message."""
        if self.use_rich:
            self.console.print(f"[yellow]⚠[/yellow] {message}", end=end)
        else:
            color = "" if self.no_color else Fore.YELLOW
            print(f"{color}⚠ {message}{Style.RESET_ALL}", end=end)
    
    def error(self, message: str, end: str = "\n"):
        """Display error message."""
        if self.use_rich:
            self.console.print(f"[red]✗[/red] {message}", end=end)
        else:
            color = "" if self.no_color else Fore.RED
            print(f"{color}✗ {message}{Style.RESET_ALL}", end=end, file=sys.stderr)
    
    def colored_text(self, text: str, color: str, end: str = "\n"):
        """Display colored text."""
        if self.use_rich:
            self.console.print(f"[{color}]{text}[/{color}]", end=end)
        else:
            if not self.no_color:
                color_map = {
                    'red': Fore.RED,
                    'green': Fore.GREEN,
                    'yellow': Fore.YELLOW,
                    'blue': Fore.BLUE,
                    'magenta': Fore.MAGENTA,
                    'cyan': Fore.CYAN,
                    'white': Fore.WHITE
                }
                color_code = color_map.get(color, "")
                print(f"{color_code}{text}{Style.RESET_ALL}", end=end)
            else:
                print(text, end=end)
    
    def show_banner(self):
        """Display application banner."""
        if self.quiet:
            return
        
        banner_text = """
╔══════════════════════════════════════════════════════════════╗
║                    Xiaomi Device Unlock Tool                ║
║                                                              ║
║  Supports: EDL Mode | BROM Mode | Mi Assistant Mode         ║
║  Features: FRP Bypass | Bootloader Unlock | Auth Bypass     ║
╚══════════════════════════════════════════════════════════════╝
"""
        
        if self.use_rich:
            panel = Panel(
                banner_text.strip(),
                title="[bold blue]Xiaomi Unlock System[/bold blue]",
                border_style="blue"
            )
            self.console.print(Align.center(panel))
        else:
            color = "" if self.no_color else Fore.CYAN + Style.BRIGHT
            print(f"{color}{banner_text}{Style.RESET_ALL}")
    
    def show_main_menu(self) -> str:
        """Display main menu and get user choice."""
        if self.use_rich:
            menu_table = Table(show_header=False, box=None, padding=(0, 2))
            menu_table.add_column("Option", style="cyan")
            menu_table.add_column("Description", style="white")
            
            menu_table.add_row("1", "Detect Devices")
            menu_table.add_row("2", "Unlock Device")
            menu_table.add_row("3", "Operation History")
            menu_table.add_row("4", "Settings")
            menu_table.add_row("5", "Test Mode")
            menu_table.add_row("0", "Exit")
            
            panel = Panel(
                menu_table,
                title="[bold]Main Menu[/bold]",
                border_style="blue"
            )
            self.console.print(panel)
            
            return Prompt.ask("Select option", choices=["0", "1", "2", "3", "4", "5"])
        else:
            print("\n" + "="*50)
            print("              MAIN MENU")
            print("="*50)
            print("1. Detect Devices")
            print("2. Unlock Device")
            print("3. Operation History")
            print("4. Settings")
            print("5. Test Mode")
            print("0. Exit")
            print("="*50)
            
            while True:
                try:
                    choice = input("Select option (0-5): ").strip()
                    if choice in ['0', '1', '2', '3', '4', '5']:
                        return choice
                    else:
                        self.error("Invalid choice. Please select 0-5.")
                except KeyboardInterrupt:
                    return '0'
    
    def show_device_table(self, devices: List[Dict[str, Any]]):
        """Display devices in a table format."""
        if not devices:
            self.info("No devices found")
            return
        
        if self.use_rich:
            table = Table(title="Detected Devices")
            table.add_column("ID", style="cyan", no_wrap=True)
            table.add_column("Model", style="green")
            table.add_column("Serial", style="yellow")
            table.add_column("Mode", style="magenta")
            table.add_column("Chipset", style="blue")
            table.add_column("Status", style="white")
            
            for device in devices:
                status = "🟢 Ready" if device.get('status') == 'ready' else "🔴 Busy"
                table.add_row(
                    device.get('id', 'Unknown')[:8],
                    f"{device.get('manufacturer', 'Unknown')} {device.get('model', 'Unknown')}",
                    device.get('serial', 'Unknown'),
                    device.get('mode', 'Unknown').upper(),
                    device.get('chipset', 'Unknown'),
                    status
                )
            
            self.console.print(table)
        else:
            print("\n" + "="*80)
            print(f"{'ID':<10} {'Model':<20} {'Serial':<15} {'Mode':<10} {'Chipset':<12} {'Status'}")
            print("="*80)
            
            for device in devices:
                status = "Ready" if device.get('status') == 'ready' else "Busy"
                print(f"{device.get('id', 'Unknown')[:8]:<10} "
                      f"{(device.get('manufacturer', '') + ' ' + device.get('model', ''))[:20]:<20} "
                      f"{device.get('serial', 'Unknown')[:15]:<15} "
                      f"{device.get('mode', 'Unknown').upper():<10} "
                      f"{device.get('chipset', 'Unknown'):<12} "
                      f"{status}")
            print("="*80)
    
    @contextmanager
    def progress_spinner(self, description: str):
        """Context manager for progress spinner."""
        if self.quiet:
            yield
            return
        
        if self.use_rich:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                transient=True,
            ) as progress:
                task = progress.add_task(description, total=None)
                yield progress
        else:
            print(f"{description}...", end="", flush=True)
            try:
                yield None
                print(" Done!")
            except Exception:
                print(" Failed!")
                raise
    
    def show_progress_bar(self, total: int, description: str = "Progress"):
        """Create and return a progress bar."""
        if self.quiet:
            return DummyProgress()
        
        if self.use_rich:
            progress = Progress(
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TimeRemainingColumn(),
            )
            progress.start()
            task = progress.add_task(description, total=total)
            return RichProgressWrapper(progress, task)
        else:
            return SimpleProgressBar(total, description)
    
    def prompt_user(self, message: str, choices: Optional[List[str]] = None) -> str:
        """Prompt user for input."""
        if self.use_rich:
            if choices:
                return Prompt.ask(message, choices=choices)
            else:
                return Prompt.ask(message)
        else:
            while True:
                try:
                    response = input(f"{message}: ").strip()
                    if choices and response not in choices:
                        self.error(f"Invalid choice. Please select from: {', '.join(choices)}")
                        continue
                    return response
                except KeyboardInterrupt:
                    raise
    
    def confirm(self, message: str, default: bool = True) -> bool:
        """Ask for user confirmation."""
        if self.use_rich:
            return Confirm.ask(message, default=default)
        else:
            suffix = " [Y/n]" if default else " [y/N]"
            try:
                response = input(f"{message}{suffix}: ").strip().lower()
                if not response:
                    return default
                return response in ['y', 'yes', '1', 'true']
            except KeyboardInterrupt:
                return False
    
    def show_operation_status(self, operation: Dict[str, Any]):
        """Display operation status."""
        if self.use_rich:
            status_color = {
                'started': 'yellow',
                'in_progress': 'blue',
                'completed': 'green',
                'failed': 'red'
            }.get(operation.get('status', 'unknown'), 'white')
            
            self.console.print(f"Operation [{status_color}]{operation.get('status', 'unknown').upper()}[/{status_color}]")
            
            if operation.get('progress'):
                progress_bar = self.show_progress_bar(100, "Operation Progress")
                progress_bar.update(operation['progress'])
        else:
            status = operation.get('status', 'unknown').upper()
            self.info(f"Operation Status: {status}")
            
            if operation.get('progress'):
                progress = operation['progress']
                bar_length = 30
                filled = int(bar_length * progress / 100)
                bar = '█' * filled + '░' * (bar_length - filled)
                print(f"Progress: [{bar}] {progress}%")


class DummyProgress:
    """Dummy progress bar for quiet mode."""
    def update(self, amount: int = 1):
        pass
    
    def close(self):
        pass


class RichProgressWrapper:
    """Wrapper for Rich progress bar."""
    def __init__(self, progress, task_id):
        self.progress = progress
        self.task_id = task_id
    
    def update(self, amount: int = 1):
        self.progress.update(self.task_id, advance=amount)
    
    def close(self):
        self.progress.stop()


class SimpleProgressBar:
    """Simple text-based progress bar."""
    def __init__(self, total: int, description: str = "Progress"):
        self.total = total
        self.current = 0
        self.description = description
        self._last_print_len = 0
    
    def update(self, amount: int = 1):
        self.current = min(self.current + amount, self.total)
        percentage = (self.current / self.total) * 100
        
        bar_length = 30
        filled = int(bar_length * self.current / self.total)
        bar = '█' * filled + '░' * (bar_length - filled)
        
        output = f"\r{self.description}: [{bar}] {percentage:.1f}% ({self.current}/{self.total})"
        
        # Clear previous output
        if self._last_print_len > len(output):
            print('\r' + ' ' * self._last_print_len, end='')
        
        print(output, end='', flush=True)
        self._last_print_len = len(output)
    
    def close(self):
        print()  # New line after progress bar
