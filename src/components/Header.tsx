
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-lime rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-brand-gold rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gradient">FidelizaGiro</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Início</a>
            <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Funcionalidades</a>
            <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Preços</a>
            <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Contato</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-brand-blue hover:bg-blue-600 text-white">
                Criar Conta
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4 mt-4">
              <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Início</a>
              <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Funcionalidades</a>
              <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Preços</a>
              <a href="#" className="text-gray-700 hover:text-brand-blue transition-colors font-medium">Contato</a>
              <div className="flex flex-col space-y-2 pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full bg-brand-blue hover:bg-blue-600 text-white">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
