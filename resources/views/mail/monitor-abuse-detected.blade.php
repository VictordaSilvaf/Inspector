<x-mail::message>
# Atividade suspeita detectada

Olá, {{ $userName }}.

Detectamos **{{ $attemptCount }}** eventos de {{ $eventLabel }} nos últimos {{ $windowMinutes }} minutos na sua conta.

Isso pode indicar tentativas automatizadas ou configuração incorreta de monitores. Revise seus monitores e credenciais se não reconhecer esta atividade.

<x-mail::button :url="route('api-inspector.index')">
Ver monitores
</x-mail::button>

</x-mail::message>
