import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { aventureiroSocoSerioHandler } from './aventureiroSocoSerio';
import { guerreiroTornadoMortal, guerreiroCorteCrescente, guerreiroRegeneracaoDeCombate, guerreiroInterceptar } from './guerreiroAbilities';
import { magoBolaDeFogo, magoExplosaoMagica, magoIntelectoSurreal, magoExplosaoGelida } from './magoAbilities';
import { assassinoModoOculto, assassinoAgilidadeExtrema, assassinoGolpeDuplo, assassinoApunhalar } from './assassinoAbilities';
import { guardiaoGolpeDeEscudo, guardiaoProvocar, guardiaoForcaDeBloqueio, guardiaoProtecaoCompartilhada } from './guardiaoAbilities';
import { druidaEssenciaDaVida, druidaEnraizar, druidaBencaoFloresta, druidaPoderSelvagem } from './druidaAbilities';
import { arqueiroDisparoPreciso, arqueiroTiroMortal, arqueiroDisparoMultiplo, arqueiroHabilidadeEPrecisao } from './arqueiroAbilities';
import { paladinoQuebraLuz, paladinoAbsolvicaoCruel, paladinoBencaoCorrompida, paladinoJulgamentoDistorcido } from './paladinoAbilities';
import { necromanteServosEsqueleticos, necromanteEscudoDeOssos, necromanteExplosaoNecrotica, necromanteAbsorverEssencia } from './necromanteAbilities';
import { bardoInicioDaComposicao, bardoAcordeDissonante, bardoMelodiaSerena, bardoBalaustradaHarmonica } from './bardoAbilities';

type AbilityHandler = (
    caster: CombatCapable,
    ability: Ability,
    allHeroes: CombatCapable[],
    allEnemies: CombatCapable[],
    dispatcher: EventDispatcher
) => UpdateResult[];

export const abilityHandlers: { [key: string]: AbilityHandler } = {
    'AVENTUREIRO_SOCO_SERIO': aventureiroSocoSerioHandler,
    'GUERREIRO_TORNADO_MORTAL': guerreiroTornadoMortal,
    'GUERREIRO_CORTE_CRESCENTE': guerreiroCorteCrescente,
    'GUERREIRO_REGENERACAO_DE_COMBATE': guerreiroRegeneracaoDeCombate,
    'GUERREIRO_INTERCEPTAR': guerreiroInterceptar,
    'MAGO_BOLA_DE_FOGO': magoBolaDeFogo,
    'MAGO_EXPLOSAO_MAGICA': magoExplosaoMagica,
    'MAGO_INTELECTO_SURREAL': magoIntelectoSurreal,
    'MAGO_EXPLOSAO_GELIDA': magoExplosaoGelida,
    'ASSASSINO_MODO_OCULTO': assassinoModoOculto,
    'ASSASSINO_AGILIDADE_EXTREMA': assassinoAgilidadeExtrema,
    'ASSASSINO_GOLPE_DUPLO': assassinoGolpeDuplo,
    'ASSASSINO_APUNHALAR': assassinoApunhalar,
    'GUARDIÃO_GOLPE_DE_ESCUDO': guardiaoGolpeDeEscudo,
    'GUARDIÃO_PROVOCAR': guardiaoProvocar,
    'GUARDIÃO_FORCA_DE_BLOQUEIO': guardiaoForcaDeBloqueio,
    'GUARDIÃO_PROTEÇÃO_COMPARTILHADA': guardiaoProtecaoCompartilhada,
    'DRUIDA_ESSENCIA_DA_VIDA': druidaEssenciaDaVida,
    'DRUIDA_ENRAIZAR': druidaEnraizar,
    'DRUIDA_BENÇÃO_FLORESTA': druidaBencaoFloresta,
    'DRUIDA_PODER_SELVAGEM': druidaPoderSelvagem,
    'ARQUEIRO_DISPARO_PRECISO': arqueiroDisparoPreciso,
    'ARQUEIRO_TIRO_MORTAL': arqueiroTiroMortal,
    'ARQUEIRO_DISPARO_MULTIPLO': arqueiroDisparoMultiplo,
    'ARQUEIRO_HABILIDADE_E_PRECISAO': arqueiroHabilidadeEPrecisao,
    'PALADINO_QUEBRA_LUZ': paladinoQuebraLuz,
    'PALADINO_ABSOLVICAO_CRUEL': paladinoAbsolvicaoCruel,
    'PALADINO_BENCAO_CORROMPIDA': paladinoBencaoCorrompida,
    'PALADINO_JULGAMENTO_DISTORCIDO': paladinoJulgamentoDistorcido,
    'NECROMANTE_SERVOS_ESQUELETICOS': necromanteServosEsqueleticos,
    'NECROMANTE_ESCUDO_DE_OSSOS': necromanteEscudoDeOssos,
    'NECROMANTE_EXPLOSAO_NECROTICA': necromanteExplosaoNecrotica,
    'NECROMANTE_ABSORVER_ESSENCIA': necromanteAbsorverEssencia,
    'BARDO_INICIO_DA_COMPOSICAO': bardoInicioDaComposicao,
    'BARDO_ACORDE_DISSONANTE': bardoAcordeDissonante,
    'BARDO_MELODIA_SERENA': bardoMelodiaSerena,
    'BARDO_BALAUSTRADA_HARMONICA': bardoBalaustradaHarmonica,
};
