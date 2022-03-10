import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy', {
    locale: ptBR,
  });
}

export function formatDateEditPost(date: string): string {
  return format(new Date(date), "dd MMM yyyy, 'às' HH:mm", {
    locale: ptBR,
  });
}
