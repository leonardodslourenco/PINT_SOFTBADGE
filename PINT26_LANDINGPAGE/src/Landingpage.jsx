import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Award,
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
  Video,
  FileText,
  UserCheck,
  CheckCircle,
  Menu,
  X,
  Smartphone,
  Download,
  ExternalLink,
  Medal,
  CheckSquare,
  Copy,
  Calendar,
  ArrowLeft,
  AlertCircle,
  Briefcase,
  Check,
  ArrowUp
} from 'lucide-react'
import styles from './Landingpage.module.css'

// Hook customizado para animação de scroll reveal (letra por letra / palavra por palavra)
function ScrollRevealText({ text, tag: Tag = 'p', className = '', delayStep = 0.02 }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const words = text.split(' ')

  return (
    <Tag ref={ref} className={`${className} ${styles.scrollRevealContainer}`}>
      {words.map((word, wIdx) => (
        <span key={wIdx} className={styles.wordSpan}>
          {word.split('').map((char, cIdx) => {
            const globalIndex = wIdx * 5 + cIdx
            return (
              <span
                key={cIdx}
                className={`${styles.charSpan} ${isVisible ? styles.charVisible : ''}`}
                style={{ transitionDelay: `${globalIndex * delayStep}s` }}
              >
                {char}
              </span>
            )
          })}
          &nbsp;
        </span>
      ))}
    </Tag>
  )
}

export default function Landingpage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getFrontendURL = () => {
    if (import.meta.env.VITE_FRONTEND_URL) {
      return import.meta.env.VITE_FRONTEND_URL
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('softbadge.pt')) {
      return 'https://webapp.softbadge.pt'
    }
    return 'http://localhost:3001'
  }

  const getBackendURL = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('softbadge.pt')) {
      return 'https://back.softbadge.pt'
    }
    return 'http://localhost:3000'
  }

  const FRONTEND_URL = getFrontendURL()
  const BACKEND_URL = getBackendURL()

  // Função auxiliar para analisar a rota atual e query params (?tipo=especial)
  const parseCurrentRoute = (pathname = window.location.pathname, search = window.location.search) => {
    const cleanPath = pathname || '/'
    const parts = cleanPath.split('/').filter(Boolean)
    const params = new URLSearchParams(search || '')
    const isEspecial = params.get('tipo') === 'especial'

    if (parts[0] === 'shares' && parts[1] && parts[2]) {
      return {
        name: 'shares',
        idUtilizador: parts[1],
        idCandidatura: parts[2],
        tipo: isEspecial ? 'especial' : 'normal'
      }
    }
    if (parts[0] === 'user' && parts[1]) {
      return { name: 'user', idUtilizador: parts[1] }
    }
    if (parts[0] === 'skill') {
      if (parts[1] === 'list') {
        return { name: 'skillList' }
      }
      if (parts[1]) {
        return { name: 'skill', idCompetencia: parts[1] }
      }
      return { name: 'skillList' }
    }
    if (parts[0] === 'validar') {
      return { name: 'validar' }
    }
    return { name: 'landing' }
  }

  // Roteamento SPA manual baseado em window.location
  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') return { name: 'landing' }
    return parseCurrentRoute(window.location.pathname, window.location.search)
  })

  // Estados adicionais para os dados dinâmicos
  const [sharedBadge, setSharedBadge] = useState(null)
  const [sharedBadgeLoading, setSharedBadgeLoading] = useState(false)
  const [sharedBadgeError, setSharedBadgeError] = useState(null)

  const [userProfile, setUserProfile] = useState(null)
  const [userProfileLoading, setUserProfileLoading] = useState(false)
  const [userProfileError, setUserProfileError] = useState(null)

  const [skillData, setSkillData] = useState(null)
  const [skillLoading, setSkillLoading] = useState(false)
  const [skillError, setSkillError] = useState(null)

  const [skillsList, setSkillsList] = useState([])
  const [skillsListLoading, setSkillsListLoading] = useState(false)
  const [skillsListError, setSkillsListError] = useState(null)
  const [skillsSearchQuery, setSkillsSearchQuery] = useState('')

  const [copied, setCopied] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Estados para a validação de certificados
  const [valNomeCompleto, setValNomeCompleto] = useState('')
  const [valCodigo, setValCodigo] = useState('')
  const [valLoading, setValLoading] = useState(false)
  const [valResult, setValResult] = useState(null)
  const [showValModal, setShowValModal] = useState(false)

  // Listener para exibição do botão flutuante "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Sempre que a rota muda, rolar imediatamente para o topo do ecrã
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [route])

  // Ponteiro customizado (Inscrever-se hover effect restrito estritamente dentro do card)
  const [cardCursorPos, setCardCursorPos] = useState({ x: 0, y: 0 })
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCardCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleCardMouseEnter = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCardCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setHoveredCardIndex(index)
  }

  const handleCardMouseLeave = () => {
    setHoveredCardIndex(null)
  }

  // Listener para botões retroceder/avançar do navegador (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseCurrentRoute(window.location.pathname, window.location.search))
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Função para navegar internamente sem full reload
  const navigateTo = (path) => {
    window.history.pushState({}, '', path)
    const [pathname, search] = path.split('?')
    setRoute(parseCurrentRoute(pathname, search ? `?${search}` : ''))
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  // Obter Badges aleatórios da landing page
  useEffect(() => {
    if (route.name === 'landing') {
      axios.get(`${BACKEND_URL}/badge/public/random`)
        .then((response) => {
          const badgesArray = Array.isArray(response.data)
            ? response.data
            : (response.data && Array.isArray(response.data.data) ? response.data.data : []);
          
          setBadges(badgesArray)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Erro ao carregar badges do backend:', err)
          setBadges([])
          setLoading(false)
        })
    }
  }, [route.name, BACKEND_URL])

  // Obter detalhes de candidatura partilhada publicamente (/shares)
  useEffect(() => {
    if (route.name === 'shares' && route.idCandidatura) {
      setSharedBadgeLoading(true)
      setSharedBadgeError(null)
      const isEspecial = route.tipo === 'especial'
      const endpoint = isEspecial
        ? `${BACKEND_URL}/candidatura_especial/public/${route.idCandidatura}`
        : `${BACKEND_URL}/candidatura_badge/public/${route.idCandidatura}`

      axios.get(endpoint)
        .then((response) => {
          if (response.data && response.data.success) {
            setSharedBadge({
              ...response.data.data,
              isEspecial: isEspecial || response.data.data?.tipo === 'especial'
            })
          } else {
            setSharedBadgeError('Conquista pública não encontrada ou indisponível.')
          }
          setSharedBadgeLoading(false)
        })
        .catch((err) => {
          console.error('Erro ao carregar candidatura partilhada:', err)
          setSharedBadgeError(err.response?.data?.message || 'Candidatura pública indisponível ou inexistente.')
          setSharedBadgeLoading(false)
        })
    }
  }, [route.name, route.idCandidatura, route.tipo, BACKEND_URL])

  // Obter perfil público do utilizador (/user)
  useEffect(() => {
    if (route.name === 'user') {
      setUserProfileLoading(true)
      setUserProfileError(null)
      axios.get(`${BACKEND_URL}/utilizador/public/${route.idUtilizador}`)
        .then((response) => {
          if (response.data && response.data.success) {
            setUserProfile(response.data.data)
          } else {
            setUserProfileError('Perfil público não está disponível.')
          }
          setUserProfileLoading(false)
        })
        .catch((err) => {
          console.error('Erro ao carregar perfil do utilizador:', err)
          setUserProfileError(err.response?.data?.message || 'Este perfil não se encontra disponível ou público.')
          setUserProfileLoading(false)
        })
    }
  }, [route.name, route.idUtilizador, BACKEND_URL])

  // Obter competência pública (/skill/:id)
  useEffect(() => {
    if (route.name === 'skill' && route.idCompetencia) {
      setSkillLoading(true)
      setSkillError(null)
      axios.get(`${BACKEND_URL}/competencia/public/${route.idCompetencia}`)
        .then((response) => {
          if (response.data && response.data.success && response.data.data) {
            setSkillData(response.data.data)
          } else {
            setSkillError('Competência não encontrada ou indisponível.')
          }
          setSkillLoading(false)
        })
        .catch((err) => {
          console.error('Erro ao carregar competência pública:', err)
          setSkillError(err.response?.data?.message || 'Competência indisponível ou inexistente.')
          setSkillLoading(false)
        })
    }
  }, [route.name, route.idCompetencia, BACKEND_URL])

  // Obter catálogo público de competências (/skill/list)
  useEffect(() => {
    if (route.name === 'skillList') {
      setSkillsListLoading(true)
      setSkillsListError(null)
      axios.get(`${BACKEND_URL}/competencia/public`)
        .then((response) => {
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            setSkillsList(response.data.data)
          } else {
            setSkillsListError('Não foi possível carregar o catálogo de competências.')
          }
          setSkillsListLoading(false)
        })
        .catch((err) => {
          console.error('Erro ao listar competências públicas:', err)
          setSkillsListError(err.response?.data?.message || 'Erro ao carregar catálogo de competências.')
          setSkillsListLoading(false)
        })
    }
  }, [route.name, BACKEND_URL])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNavigateFrontend = () => {
    window.location.href = FRONTEND_URL
  }

  const renderLandingPage = () => {
    return (
      <>
        {/* ─── HERO SECTION ────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <div className={styles.heroBlob1} />
            <div className={styles.heroBlob2} />
          </div>

          <div className={styles.heroContainer}>
            <div className={styles.heroContent}>
              <div className={styles.heroTag}>
                <Medal size={30} color="#2563EB" /> Sistema de Gamificação Softbadge.PT
              </div>

              <h1 className={styles.heroTitle}>
                Valide e Reconheça as suas <span className="text-gradient">Competências Profissionais</span>
              </h1>

              <ScrollRevealText
                text="Uma plataforma inovadora para gestão de formação contínua, certificação digital e emissão de badges verificáveis. Ganhe reconhecimento pelas suas conquistas e avance na sua carreira."
                className={styles.heroDescription}
                delayStep={0.015}
              />

              <div className={styles.heroButtons}>
                <button
                  onClick={handleNavigateFrontend}
                  className={styles.btnPrimaryLg}
                >
                  Começar Agora <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('features');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={styles.btnSecondaryLg}
                >
                  Saber Mais
                </button>
              </div>

              <div className={styles.heroStats}>
                <div>
                  <h4>+20</h4>
                  <p>Badges Disponíveis</p>
                </div>
                <div>
                  <h4>+300</h4>
                  <p>Consultores Ativos</p>
                </div>
                <div>
                  <h4>98%</h4>
                  <p>Taxa de Aprovação</p>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.cardContainer}>
                <div className={styles.floatingCard1}>
                  <Award className={styles.floatIcon} size={28} />
                  <div>
                    <h5>Badge Desbloqueado!</h5>
                    <p>Cyber Defender Specialist</p>
                  </div>
                </div>
                <div className={styles.floatingCard2}>
                  <CheckCircle className={styles.floatIconSuccess} size={24} style={{ color: '#10B981', background: '#ECFDF5', borderRadius: '50%', padding: '4px' }} />
                  <div>
                    <h5>Curso Concluído</h5>
                    <p>Liderança Ágil Avançada</p>
                  </div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
                  alt="Plataforma de E-Learning & Gamificação"
                  className={styles.heroImage}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES SECTION ─────────────────────────────────── */}
        <section id="features" className={styles.features}>
          <div className={styles.sectionHeader}>
            <span className={styles.subTitleTag}>Funcionalidades Avançadas</span>
            <ScrollRevealText
              tag="h2"
              text="Desenhado para Potenciar a Sua Evolução Profissional"
              className={styles.sectionHeading}
              delayStep={0.02}
            />
            <p className={styles.sectionSubHeading}>
              Tudo o que precisa para gerir, acompanhar e enriquecer o percurso formativo com reconhecimento digital oficial.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Layers size={24} />
              </div>
              <h3>Learning Paths de Badges</h3>
              <p>Percursos estruturados em trilhos de aprendizagem com requisitos e níveis progressivos de conquista.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <CheckSquare size={24} />
              </div>
              <h3>Revisão & Moderação por Talent Managers</h3>
              <p>Validação criteriosa de evidências e aprovação das submissões de candidatura por especialistas.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Award size={24} />
              </div>
              <h3>Badges & Gamificação</h3>
              <p>Reconhecimento visual imediato por competências validadas e atribuição de insígnias digitais.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <FileText size={24} />
              </div>
              <h3>Certificados Automáticos</h3>
              <p>Emissão de certificados oficiais em PDF após a conclusão com sucesso de todos os requisitos do Badge.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <UserCheck size={24} />
              </div>
              <h3>Segurança & Autenticação Forte</h3>
              <p>Proteção rigorosa de dados pessoais, encriptação avançada e controlo estrito de privacidade.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Shield size={24} />
              </div>
              <h3>Gestão de Perfis e Acessos</h3>
              <p>Perfis diferenciados para Administradores, Service Line Leaders, Talent Managers e Consultores.</p>
            </div>
          </div>
        </section>

        {/* ─── FEATURED COURSES SECTION ────────────────────────── */}
        <section id="badges" className={styles.courses}>
          <div className={styles.sectionHeader}>
            <span className={styles.subTitleTag}>Catálogo em Destaque</span>
            <ScrollRevealText
              tag="h2"
              text="Explore Alguns dos Nossos Badges Mais Procurados"
              className={styles.sectionHeading}
              delayStep={0.02}
            />
            <p className={styles.sectionSubHeading}>
              Passe o ponteiro sobre qualquer card para se candidatar e aceder diretamente à plataforma.
            </p>
          </div>

          <div className={styles.coursesGrid}>
            {badges.map((b, i) => {
              const logoUrl = b.logo
                ? `${BACKEND_URL}/uploads/logo_badges/${b.logo}`
                : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'

              return (
                <div
                  key={b.id_badge || i}
                  className={styles.courseCard}
                  onMouseEnter={(e) => handleCardMouseEnter(e, i)}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  onClick={handleNavigateFrontend}
                >
                  {/* Badge/Ponteiro Flutuante 'Inscrever-se' restrito estritamente ao interior do Card */}
                  <div
                    className={`${styles.cardCustomCursor} ${hoveredCardIndex === i ? styles.cardCustomCursorActive : ''}`}
                    style={{
                      left: `${cardCursorPos.x}px`,
                      top: `${cardCursorPos.y}px`
                    }}
                  >
                    <span>Inscrever-se</span>
                  </div>

                  <div className={styles.courseImageWrapper}>
                    <img src={logoUrl} alt={b.titulo} style={{ objectFit: 'contain', padding: '1rem', background: '#F8FAFC' }} />
                    <span className={styles.courseTypeBadge}>{b.nivel}</span>
                  </div>
                  <div className={styles.courseContent}>
                    <span className={styles.courseCategory}>{b.lp || 'Sem Jornada'}</span>
                    <h3>{b.titulo}</h3>
                    <div className={styles.courseMeta}>
                      <span>⏱ {b.requisitos_count} Requisitos</span>
                      <span>⭐ {b.pontos} Pontos</span>
                    </div>
                    <div className={styles.courseInstructor}>
                      <span>Responsável: <strong>{b.sl_responsavel || b.sll || 'Sem Responsável'}</strong></span>
                    </div>
                    <div className={styles.courseFooter}>
                      <div className={styles.badgeReward}>
                        <Award size={14} /> Área: {b.area}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── MOBILE APP SECTION ──────────────────────────────── */}
        <section id="mobile" className={styles.mobileSection}>
          <div className={styles.mobileContainer}>
            <div className={styles.mobileContent}>
              <span className={styles.subTitleTag}><Smartphone size={16} /> Aplicação Android</span>
              <ScrollRevealText
                tag="h2"
                text="Leve a sua Aprendizagem para Qualquer Lugar"
                className={styles.sectionHeading}
                delayStep={0.02}
              />
              <p className={styles.mobileDescription}>
                Descarregue a nossa aplicação móvel exclusiva para Android. Acompanhe os seus badges, conclua Learning Paths e receba notificações em tempo real.
              </p>
              <div className={styles.downloadButtons}>
                <a href="/SoftBadge.apk" download="SoftBadge.apk" className={styles.btnDownload}>
                  <Download size={20} /> Descarregar APK Android
                </a>
                <span className={styles.apkInfo}>Versão 1.0.4 • Exclusivo para Android (.apk)</span>
              </div>
            </div>
            <div className={styles.mobileVisual}>
              <div className={styles.phoneMockup}>
                <div className={styles.phoneScreen}>
                  <Award size={48} color="#2563EB" />
                  <h4>Badge App Mobile</h4>
                  <p>Gamificação na palma da mão</p>
                  <div className={styles.mockBadgeList}>
                    <div className={styles.mockBadgeItem}>🏆 Cyber Defender</div>
                    <div className={styles.mockBadgeItem}>⭐ Agile Master</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  const renderSharesPage = () => {
    if (sharedBadgeLoading) {
      return (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonLineShort} />
            <div className={styles.skeletonBadge} />
            <div className={styles.skeletonLineLong} />
            <div className={styles.skeletonLineMedium} />
          </div>
        </div>
      )
    }

    if (sharedBadgeError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <AlertCircle size={48} color="#EF4444" />
            <h2>Conquista Indisponível</h2>
            <p>{sharedBadgeError}</p>
            <button onClick={() => navigateTo('/')} className={styles.btnPrimary}>
              Voltar ao Início
            </button>
          </div>
        </div>
      )
    }

    if (!sharedBadge) return null

    const isEspecial = sharedBadge.isEspecial || sharedBadge.tipo === 'especial' || route.tipo === 'especial'

    const userAvatarUrl = sharedBadge.avatar_utilizador
      ? `${BACKEND_URL}/uploads/avatars/${sharedBadge.avatar_utilizador}`
      : null

    const logoUrl = sharedBadge.badge_logo
      ? (isEspecial
          ? `${BACKEND_URL}/uploads/logo_especial/${sharedBadge.badge_logo}`
          : `${BACKEND_URL}/uploads/logo_badges/${sharedBadge.badge_logo}`)
      : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'

    const formatData = (d) => {
      if (!d) return ''
      return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataExp = sharedBadge.data_expiracao ? new Date(sharedBadge.data_expiracao) : null
    const isExpirado = dataExp ? dataExp < hoje : false

    return (
      <div className={styles.sharesPage}>
        <div className={styles.glowBg1} />
        <div className={styles.glowBg2} />
        
        <div className={styles.shareCardContainer}>
          <div className={styles.shareCard}>
            <div className={styles.shareConsultantHeader}>
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt={sharedBadge.nome_utilizador} className={styles.consultantAvatar} />
              ) : (
                <div className={styles.consultantAvatarPlaceholder}>
                  {sharedBadge.nome_utilizador?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4>{sharedBadge.nome_utilizador}</h4>
                <p className={styles.conqueredLabel}>
                  {isEspecial
                    ? 'conquistou publicamente esta Conquista Especial'
                    : 'conquistou publicamente este badge digital'}
                </p>
              </div>
            </div>

            <div className={styles.shareBadgeHero}>
              <div className={isEspecial ? styles.badgeLogoWrapperSpecial : styles.badgeLogoWrapper}>
                <img src={logoUrl} alt={sharedBadge.badge_nome} />
              </div>
              {isEspecial ? (
                <span className={styles.badgeSpecialTag}>
                  <Medal size={14} /> Conquista Especial de Mérito
                </span>
              ) : (
                <span className={styles.badgeNivelTag}>{sharedBadge.nivel_nome}</span>
              )}
              <h2>{sharedBadge.badge_nome}</h2>
              <p className={styles.badgeDescriptionText}>{sharedBadge.badge_descricao}</p>
            </div>

            {/* Grelha de Detalhes Diferenciada */}
            {isEspecial ? (
              <div className={styles.badgeDetailsGrid}>
                <div className={styles.detailItem}>
                  <Medal size={18} color="#D97706" />
                  <div>
                    <span>Pontuação Bónus</span>
                    <strong style={{ color: '#D97706' }}>+{sharedBadge.badge_pontos} Pontos</strong>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Calendar size={18} />
                  <div>
                    <span>Data da Atribuição</span>
                    <strong>{formatData(sharedBadge.data_conquista)}</strong>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Award size={18} color="#2563EB" />
                  <div>
                    <span>Categoria</span>
                    <strong>Badge Especial de Mérito</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.badgeDetailsGrid}>
                <div className={styles.detailItem}>
                  <Layers size={18} />
                  <div>
                    <span>Jornada (Learning Path)</span>
                    <strong>{sharedBadge.lp_nome || 'Sem Jornada'}</strong>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Briefcase size={18} />
                  <div>
                    <span>Linha de Serviço</span>
                    <strong>{sharedBadge.sl_nome || 'Sem Linha'}</strong>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Award size={18} />
                  <div>
                    <span>Área de Competência</span>
                    <strong>{sharedBadge.area_nome}</strong>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Medal size={18} />
                  <div>
                    <span>Pontuação Ganha</span>
                    <strong>{sharedBadge.badge_pontos} Pontos</strong>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Calendar size={18} />
                  <div>
                    <span>Data da Conquista</span>
                    <strong>{formatData(sharedBadge.data_conquista)}</strong>
                  </div>
                </div>
                {sharedBadge.data_expiracao && (
                  <div
                    className={`${styles.detailItem} ${
                      isExpirado ? styles.expiracaoItemExpirado : styles.expiracaoItemValido
                    }`}
                  >
                    <Calendar size={18} color={isExpirado ? '#DC2626' : '#059669'} />
                    <div>
                      <span>{isExpirado ? 'Expirou a' : 'Válido até'}</span>
                      <strong style={{ color: isExpirado ? '#DC2626' : '#059669' }}>
                        {formatData(sharedBadge.data_expiracao)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Competências Associadas ao Badge (Badges Regulares) */}
            {!isEspecial && sharedBadge.competencias && sharedBadge.competencias.length > 0 && (
              <div className={styles.shareCompetenciasSection}>
                <div className={styles.shareCompetenciasHeader}>
                  <div className={styles.shareCompetenciasTitleRow}>
                    <Award size={18} color="#2563EB" />
                    <h4>Competências Conferidas por este Badge</h4>
                  </div>
                  <span className={styles.shareCompetenciasTag}>
                    {sharedBadge.competencias.length} {sharedBadge.competencias.length === 1 ? 'Competência' : 'Competências'}
                  </span>
                </div>

                <div className={styles.shareCompetenciasGrid}>
                  {sharedBadge.competencias.map((comp) => (
                    <div
                      key={comp.id_competencia}
                      className={styles.shareCompetenciaCard}
                      onClick={() => navigateTo(`/skill/${comp.id_competencia}`)}
                    >
                      <div className={styles.shareCompetenciaCardTop}>
                        <div className={styles.shareCompetenciaCardIcon}>
                          <Award size={18} color="#2563EB" />
                        </div>
                        <span className={styles.shareCompetenciaCardBadge}>Competência</span>
                      </div>
                      <h5 className={styles.shareCompetenciaCardTitle}>{comp.nome}</h5>
                      {comp.descricao && (
                        <p className={styles.shareCompetenciaCardDesc}>{comp.descricao}</p>
                      )}
                      <div className={styles.shareCompetenciaCardFooter}>
                        <span>Ver Competência</span>
                        <ArrowRight size={14} className={styles.shareCompetenciaCardArrow} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações do Cartão */}
            <div className={styles.shareCardActions}>
              {!isEspecial && (
                <button onClick={handleCopyLink} className={styles.btnSecondary}>
                  {copied ? (
                    <>
                      <Check size={16} style={{ marginRight: 8 }} /> Link Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={16} style={{ marginRight: 8 }} /> Partilhar Conquista
                    </>
                  )}
                </button>
              )}
              <button 
                onClick={() => navigateTo(`/user/${sharedBadge.id_utilizador || route.idUtilizador}`)} 
                className={styles.btnPrimary}
                style={isEspecial ? { width: '100%', justifyContent: 'center' } : {}}
              >
                Ver Perfil do Consultor <ArrowRight size={16} style={{ marginLeft: 8 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderUserPage = () => {
    if (userProfileLoading) {
      return (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonProfileHeader}>
            <div className={styles.skeletonAvatarLarge} />
            <div className={styles.skeletonLineShort} />
            <div className={styles.skeletonLineMedium} />
          </div>
          <div className={styles.skeletonGrid}>
            <div className={styles.skeletonGridCard} />
            <div className={styles.skeletonGridCard} />
            <div className={styles.skeletonGridCard} />
          </div>
        </div>
      )
    }

    if (userProfileError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <AlertCircle size={48} color="#EF4444" />
            <h2>Perfil Indisponível</h2>
            <p>{userProfileError}</p>
            <button onClick={() => navigateTo('/')} className={styles.btnPrimary}>
              Voltar ao Início
            </button>
          </div>
        </div>
      )
    }

    if (!userProfile) return null

    const profileAvatarUrl = userProfile.avatar_utilizador
      ? `${BACKEND_URL}/uploads/avatars/${userProfile.avatar_utilizador}`
      : null

    const registerDate = userProfile.data_registo
      ? new Date(userProfile.data_registo).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
      : ''

    const numBadgesNormais = userProfile.badges?.length || 0
    const numBadgesEspeciais = userProfile.badges_especiais?.length || 0
    const totalBadges = numBadgesNormais + numBadgesEspeciais

    return (
      <div className={styles.userProfilePage}>
        <div className={styles.profileGlow1} />
        <div className={styles.profileGlow2} />

        <div className={styles.profileHeroContainer}>
          <div className={styles.profileHeroCard}>
            <div className={styles.avatarLargeWrapper}>
              {profileAvatarUrl ? (
                <img src={profileAvatarUrl} alt={userProfile.nome_utilizador} className={styles.profileAvatarLarge} />
              ) : (
                <div className={styles.profileAvatarPlaceholder}>
                  {userProfile.nome_utilizador?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className={styles.profileMetaInfo}>
              <div className={styles.verifiedBadgeRow}>
                <h2>{userProfile.nome_utilizador}</h2>
                <span className={styles.verifiedTag}>Consultor Verificado</span>
              </div>
              <p className={styles.memberSince}>Membro ativo da plataforma desde {registerDate}</p>
              <div className={styles.profileBadgeCounter}>
                <Award size={18} />
                <strong>{totalBadges} {totalBadges === 1 ? 'Badge Conquistado' : 'Badges Conquistados'}</strong>
                {numBadgesEspeciais > 0 && (
                  <span className={styles.profileSpecialBadgesCounterTag}>
                    ⭐ {numBadgesEspeciais} {numBadgesEspeciais === 1 ? 'Especial' : 'Especiais'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECÇÃO DE BADGES ESPECIAIS ─────────────────────── */}
        {userProfile.badges_especiais && userProfile.badges_especiais.length > 0 && (
          <div className={styles.profileSpecialSection}>
            <div className={styles.specialSectionHeader}>
              <div className={styles.specialHeaderTag}>
                <Medal size={15} /> Conquistas de Mérito
              </div>
              <h3 className={styles.specialSectionTitle}>Badges Especiais</h3>
              <p className={styles.sectionSubtitle}>
                Reconhecimentos de mérito atribuídos ao consultor pelo seu desempenho e distinção profissional.
              </p>
            </div>

            <div className={styles.profileSpecialBadgesGrid}>
              {userProfile.badges_especiais.map((esp) => {
                const espLogo = esp.badge_logo
                  ? `${BACKEND_URL}/uploads/logo_especial/${esp.badge_logo}`
                  : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'

                const conquistaDate = esp.data_conquista
                  ? new Date(esp.data_conquista).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : ''

                return (
                  <div
                    key={esp.id_candidatura_especial}
                    className={styles.profileSpecialBadgeCard}
                    onClick={() =>
                      navigateTo(
                        `/shares/${userProfile.id_utilizador || route.idUtilizador}/${esp.id_candidatura_especial}?tipo=especial`
                      )
                    }
                  >
                    <div className={styles.specialCardBadgeTop}>
                      <span className={styles.specialTagBadge}>⭐ Especial</span>
                      {esp.badge_pontos > 0 && (
                        <span className={styles.specialPointsBadge}>+{esp.badge_pontos} pts</span>
                      )}
                    </div>

                    <div className={styles.profileSpecialCardLogoWrapper}>
                      <img src={espLogo} alt={esp.badge_nome} />
                    </div>

                    <div className={styles.profileSpecialCardContent}>
                      <h4>{esp.badge_nome}</h4>
                      {esp.badge_descricao && (
                        <p className={styles.profileSpecialCardDesc}>{esp.badge_descricao}</p>
                      )}
                      <div className={styles.profileSpecialCardFooter}>
                        <span><Calendar size={13} style={{ marginRight: 5 }} /> Atribuído em {conquistaDate}</span>
                        <ArrowRight size={15} className={styles.specialCardArrow} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── SECÇÃO DE BADGES REGULARES DE COMPETÊNCIA ───────── */}
        <div className={styles.profileBadgesSection}>
          <h3 className={styles.sectionTitle}>Portfólio de Badges de Competência</h3>
          <p className={styles.sectionSubtitle}>Badges validados e partilhados pelo consultor de acordo com as normas de proteção de dados.</p>

          <div className={styles.profileBadgesGrid}>
            {userProfile.badges?.map((b) => {
              const badgeLogo = b.badge_logo
                ? `${BACKEND_URL}/uploads/logo_badges/${b.badge_logo}`
                : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'

              const conquistaDate = b.data_conquista
                ? new Date(b.data_conquista).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : ''

              return (
                <div 
                  key={b.id_candidatura} 
                  className={styles.profileBadgeCard}
                  onClick={() => navigateTo(`/shares/${userProfile.id_utilizador || userProfile.badges[0]?.id_utilizador || route.idUtilizador}/${b.id_candidatura}`)}
                >
                  <div className={styles.profileBadgeCardCursor}>
                    <span>Ver Detalhes</span>
                  </div>
                  
                  <div className={styles.profileBadgeCardLogo}>
                    <img src={badgeLogo} alt={b.badge_nome} />
                  </div>
                  <div className={styles.profileBadgeCardContent}>
                    <span className={styles.profileBadgeCardLp}>{b.lp_nome || 'Sem Jornada'}</span>
                    <h4>{b.badge_nome}</h4>
                    <p className={styles.profileBadgeCardDesc}>{b.badge_descricao}</p>
                    
                    <div className={styles.profileBadgeCardMeta}>
                      <span>Nível: <strong>{b.nivel_nome}</strong></span>
                      <span>⭐ {b.badge_pontos} Pontos</span>
                    </div>

                    <div className={styles.profileBadgeCardFooter}>
                      <Calendar size={14} style={{ marginRight: 6 }} /> Conquistado em {conquistaDate}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderSkillPage = () => {
    if (skillLoading) {
      return (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonProfileHeader}>
            <div className={styles.skeletonAvatarLarge} />
            <div className={styles.skeletonLineShort} />
            <div className={styles.skeletonLineMedium} />
          </div>
          <div className={styles.skeletonGrid}>
            <div className={styles.skeletonGridCard} />
            <div className={styles.skeletonGridCard} />
            <div className={styles.skeletonGridCard} />
          </div>
        </div>
      )
    }

    if (skillError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <AlertCircle size={48} color="#EF4444" />
            <h2>Competência Indisponível</h2>
            <p>{skillError}</p>
            <button onClick={() => navigateTo('/')} className={styles.btnPrimary}>
              Voltar ao Início
            </button>
          </div>
        </div>
      )
    }

    if (!skillData) return null

    const totalBadges = skillData.badges?.length || 0

    return (
      <div className={styles.skillPage}>
        <div className={styles.skillGlow1} />
        <div className={styles.skillGlow2} />

        <div className={styles.skillHeroContainer}>
          <div className={styles.skillHeroCard}>
            <div className={styles.skillIconWrapper}>
              <Award size={36} color="#2563EB" />
            </div>

            <div className={styles.skillMetaInfo}>
              <div className={styles.skillTagRow}>
                <span className={styles.skillCategoryTag}>Competência Oficial</span>
                <div className={styles.skillBadgeCountTag}>
                  <Award size={14} />
                  <span>{totalBadges} {totalBadges === 1 ? 'Badge Associado' : 'Badges Associados'}</span>
                </div>
              </div>
              <h2 className={styles.skillTitle}>{skillData.titulo}</h2>
              <div className={styles.skillDescription}>
                <p>{skillData.descricao || 'Esta competência valida conhecimentos e competências específicas demonstradas na plataforma.'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.skillBadgesSection}>
          <div className={styles.skillSectionHeader}>
            <h3 className={styles.sectionTitle}>Badges que Conferem Esta Competência</h3>
            <p className={styles.sectionSubtitle}>
              Ao concluir com sucesso os requisitos e candidaturas associadas a estes badges, os consultores comprovam o domínio desta competência.
            </p>
          </div>

          {totalBadges === 0 ? (
            <div className={styles.skillEmptyBadges}>
              <p>Nenhum badge público ativo está atualmente associado a esta competência.</p>
            </div>
          ) : (
            <div className={styles.skillBadgesGrid}>
              {skillData.badges?.map((b) => {
                const badgeLogo = b.logo
                  ? `${BACKEND_URL}/uploads/logo_badges/${b.logo}`
                  : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'

                return (
                  <div key={b.id_badge} className={styles.skillBadgeCard}>
                    <div className={styles.skillBadgeLogoWrapper}>
                      <img
                        src={badgeLogo}
                        alt={b.titulo}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'
                        }}
                      />
                    </div>
                    <div className={styles.skillBadgeCardContent}>
                      <div className={styles.skillBadgeCardPills}>
                        {b.area && <span className={styles.skillBadgePillArea}>{b.area}</span>}
                        {b.nivel && <span className={styles.skillBadgePillNivel}>{b.nivel}</span>}
                      </div>
                      <h4>{b.titulo}</h4>
                      {b.descricao && <p className={styles.skillBadgeCardDesc}>{b.descricao}</p>}
                      <div className={styles.skillBadgeCardMeta}>
                        <span>⭐ {b.pontos || 0} Pontos</span>
                        <span className={styles.skillBadgeVerifiedBadge}>
                          <CheckCircle size={13} color="#10B981" /> Acreditado
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSkillListPage = () => {
    if (skillsListLoading) {
      return (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonProfileHeader}>
            <div className={styles.skeletonAvatarLarge} />
            <div className={styles.skeletonLineShort} />
            <div className={styles.skeletonLineMedium} />
          </div>
          <div className={styles.skeletonGrid}>
            <div className={styles.skeletonGridCard} />
            <div className={styles.skeletonGridCard} />
            <div className={styles.skeletonGridCard} />
          </div>
        </div>
      )
    }

    if (skillsListError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <AlertCircle size={48} color="#EF4444" />
            <h2>Catálogo Indisponível</h2>
            <p>{skillsListError}</p>
            <button onClick={() => navigateTo('/')} className={styles.btnPrimary}>
              Voltar ao Início
            </button>
          </div>
        </div>
      )
    }

    const filteredSkills = skillsList.filter((c) => {
      const q = skillsSearchQuery.toLowerCase()
      return (
        (c.titulo || '').toLowerCase().includes(q) ||
        (c.descricao || '').toLowerCase().includes(q)
      )
    })

    return (
      <div className={styles.skillListPage}>
        <div className={styles.skillGlow1} />
        <div className={styles.skillGlow2} />

        <div className={styles.skillListHeroContainer}>
          <div className={styles.skillListHeroCard}>
            <div className={styles.skillIconWrapper}>
              <Award size={36} color="#2563EB" />
            </div>

            <div className={styles.skillMetaInfo}>
              <div className={styles.skillTagRow}>
                <span className={styles.skillCategoryTag}>Competências Oficiais</span>
                <div className={styles.skillBadgeCountTag}>
                  <Award size={14} />
                  <span>{skillsList.length} Competências Registadas</span>
                </div>
              </div>
              <h2 className={styles.skillTitle}>Catálogo de Competências</h2>
              <div className={styles.skillDescription}>
                <p>
                  Explore todas as competências e especializações reconhecidas na plataforma Softbadge.PT.
                  Selecione uma competência para consultar a sua descrição completa e os badges associados.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.skillListSearchSection}>
          <div className={styles.skillSearchWrapper}>
            <input
              type="text"
              placeholder="Pesquisar por título ou descrição da competência..."
              value={skillsSearchQuery}
              onChange={(e) => setSkillsSearchQuery(e.target.value)}
              className={styles.skillSearchInput}
            />
            {skillsSearchQuery && (
              <button
                type="button"
                onClick={() => setSkillsSearchQuery('')}
                className={styles.skillSearchClearBtn}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className={styles.skillListSection}>
          {filteredSkills.length === 0 ? (
            <div className={styles.skillEmptyBadges}>
              <p>Nenhuma competência encontrada para a pesquisa atual.</p>
            </div>
          ) : (
            <div className={styles.skillListGrid}>
              {filteredSkills.map((c) => (
                <div
                  key={c.id_competencia}
                  className={styles.skillListCard}
                  onClick={() => navigateTo(`/skill/${c.id_competencia}`)}
                >
                  <div className={styles.skillListCardTop}>
                    <div className={styles.skillListCardIcon}>
                      <Award size={22} color="#2563EB" />
                    </div>
                    <span className={styles.skillListCardTag}>Oficial</span>
                  </div>

                  <h3 className={styles.skillListCardTitle}>{c.titulo}</h3>
                  <p className={styles.skillListCardDesc}>{c.descricao}</p>

                  <div className={styles.skillListCardFooter}>
                    <span>Consultar Badges</span>
                    <ArrowRight size={16} className={styles.skillListCardArrow} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleValidateCertificate = (e) => {
    e.preventDefault()
    if (!valNomeCompleto.trim() || !valCodigo.trim()) return

    setValLoading(true)
    setValResult(null)

    axios.get(`${BACKEND_URL}/certificado/public/validar`, {
      params: {
        codigo: valCodigo.trim(),
        nome_completo: valNomeCompleto.trim()
      }
    })
      .then((response) => {
        if (response.data) {
          setValResult({
            success: true,
            valido: !!response.data.valido,
            data: response.data.data || null,
            message: response.data.message
          })
        } else {
          setValResult({ success: false, valido: false, message: 'Resposta inválida do servidor.' })
        }
        setShowValModal(true)
        setValLoading(false)
      })
      .catch((err) => {
        console.error('Erro na validação do certificado:', err)
        setValResult({
          success: false,
          valido: false,
          message: err.response?.data?.message || 'Dados inválidos ou erro de ligação ao servidor.'
        })
        setShowValModal(true)
        setValLoading(false)
      })
  }

  const renderValidationPage = () => {
    const certData = valResult?.data

    const formatDataEmissao = (dateStr) => {
      if (!dateStr) return null
      try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return dateStr
        return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      } catch (e) {
        return dateStr
      }
    }

    return (
      <div className={styles.validationPage}>
        <div className={styles.valGlow1} />
        <div className={styles.valGlow2} />

        <div className={styles.valContainer}>
          <div className={styles.valCard}>
            <div className={styles.valHeader}>
              <Award size={40} color="#2563EB" />
              <h2>Validação de Certificados</h2>
              <p>Introduza os dados impressos no certificado para confirmar a autenticidade e validade do documento emitido.</p>
            </div>

            <form onSubmit={handleValidateCertificate} className={styles.valForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="valNomeCompleto">Nome Completo do Consultor</label>
                <input
                  type="text"
                  id="valNomeCompleto"
                  value={valNomeCompleto}
                  onChange={(e) => setValNomeCompleto(e.target.value)}
                  placeholder="Introduza o nome completo conforme no certificado"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="valCodigo">Código de Validação</label>
                <input
                  type="text"
                  id="valCodigo"
                  value={valCodigo}
                  onChange={(e) => setValCodigo(e.target.value)}
                  placeholder="Ex: CERT-XXXX-XXXX"
                  required
                />
              </div>

              <button type="submit" className={styles.btnPrimaryLg} disabled={valLoading} style={{ width: '100%', marginTop: '1rem' }}>
                {valLoading ? 'A verificar...' : 'Validar Autenticidade'}
              </button>
            </form>
          </div>
        </div>

        {/* Modal de Comemoração / Lamentação */}
        {showValModal && valResult && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              {valResult.valido ? (
                // Comemoração (Sucesso)
                <div className={styles.celebrationModal}>
                  <div className={styles.confettiContainer}>
                    <svg className={styles.confetti} viewBox="0 0 100 100">
                      <circle cx="20" cy="20" r="2" fill="#F59E0B" />
                      <rect x="50" y="30" width="3" height="6" fill="#10B981" transform="rotate(45 50 30)" />
                      <circle cx="80" cy="15" r="1.5" fill="#3B82F6" />
                      <rect x="15" y="70" width="4" height="4" fill="#EC4899" transform="rotate(15 15 70)" />
                      <circle cx="85" cy="75" r="2.5" fill="#10B981" />
                    </svg>
                  </div>
                  
                  <div className={styles.successIconWrapper}>
                    <CheckCircle size={48} color="#10B981" />
                  </div>
                  <h3>Certificado Autêntico & Válido!</h3>
                  <p className={styles.successText}>
                    Confirmamos com sucesso que este certificado é autêntico e foi devidamente emitido pela plataforma <strong>Softbadge.PT</strong>.
                  </p>
                  
                  <div className={styles.modalDetails}>
                    <div className={styles.modalDetailRow}>
                      <span>Titular</span>
                      <strong>{certData?.consultor || valNomeCompleto.trim()}</strong>
                    </div>

                    {certData?.badge && (
                      <div className={styles.modalDetailHighlight}>
                        <div className={styles.modalBadgeHeader}>
                          <span className={styles.modalBadgeLabel}>Badge Conquistado</span>
                          {certData?.pontos !== undefined && (
                            <span className={styles.modalBadgePontos}>⭐ {certData.pontos} Pontos</span>
                          )}
                        </div>
                        <h4 className={styles.modalBadgeTitle}>{certData.badge}</h4>
                        <div className={styles.modalBadgeTags}>
                          {certData?.area && <span className={styles.modalPillArea}>{certData.area}</span>}
                          {certData?.nivel && <span className={styles.modalPillNivel}>{certData.nivel}</span>}
                          {certData?.service_line && <span className={styles.modalPillService}>{certData.service_line}</span>}
                        </div>
                      </div>
                    )}

                    {certData?.learning_path && (
                      <div className={styles.modalDetailRow}>
                        <span>Trilha de Aprendizagem</span>
                        <strong>{certData.learning_path}</strong>
                      </div>
                    )}

                    <div className={styles.modalDetailRow}>
                      <span>Código de Validação</span>
                      <strong className={styles.modalCodeText}>
                        {certData?.codigo_validacao || valCodigo.trim().toUpperCase()}
                      </strong>
                    </div>

                    {certData?.data_emissao && (
                      <div className={styles.modalDetailRow}>
                        <span>Data de Emissão</span>
                        <strong>{formatDataEmissao(certData.data_emissao)}</strong>
                      </div>
                    )}
                  </div>

                  <button onClick={() => { setShowValModal(false); setValCodigo(''); setValNomeCompleto(''); }} className={styles.btnPrimary} style={{ width: '100%' }}>
                    Concluir
                  </button>
                </div>
              ) : (
                // Lamentação (Erro)
                <div className={styles.lamentModal}>
                  <div className={styles.errorIconWrapper}>
                    <AlertCircle size={48} color="#EF4444" />
                  </div>
                  <h3>Certificado não Encontrado</h3>
                  <p className={styles.errorText}>
                    Não foi possível validar este certificado com os dados fornecidos.
                  </p>
                  <div className={styles.errorTips}>
                    <p>Motivos prováveis:</p>
                    <ul>
                      <li>O código de validação foi digitado incorretamente.</li>
                      <li>O nome completo não corresponde exatamente ao titular.</li>
                      <li>O certificado ainda não foi registado na plataforma.</li>
                    </ul>
                  </div>
                  <button onClick={() => setShowValModal(false)} className={styles.btnSecondary} style={{ width: '100%' }}>
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.landing}>


      {/* ─── HEADER/NAVBAR ───────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <div className={styles.logo} onClick={() => navigateTo('/')}>
            <div className={styles.logoIcon}>
              <Award size={24} color="#2563EB" />
            </div>
            <span className={styles.logoText}>
              Soft<span className="text-gradient">Badge.PT</span>
            </span>
          </div>

          {route.name === 'landing' ? (
            <>
              <nav className={styles.desktopNav}>
                <a href="#features">Recursos</a>
                <a href="#badges">Badges em Destaque</a>
                <a href="#mobile">App Mobile</a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('/skill/list'); }}>Competências</a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('/validar'); }}>Validar Certificado</a>
              </nav>

              <div className={styles.navActions}>
                <button
                  onClick={handleNavigateFrontend}
                  className={styles.btnPrimary}
                >
                  Aceder à Plataforma <ExternalLink size={16} style={{ marginLeft: 6 }} />
                </button>
              </div>

              <button
                className={styles.mobileMenuBtn}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            <div className={styles.navActions}>
              <button
                onClick={() => navigateTo('/')}
                className={styles.btnGhost}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} /> Voltar ao Início
              </button>
              <button
                onClick={handleNavigateFrontend}
                className={styles.btnPrimary}
              >
                Plataforma <ExternalLink size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          )}
        </div>

        {/* Menu Mobile */}
        {route.name === 'landing' && mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
            <a href="#badges" onClick={() => setMobileMenuOpen(false)}>Badges em Destaque</a>
            <a href="#mobile" onClick={() => setMobileMenuOpen(false)}>App Mobile</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo('/skill/list'); }}>Competências</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo('/validar'); }}>Validar Certificado</a>
            <div className={styles.mobileNavActions}>
              <button
                onClick={handleNavigateFrontend}
                className={styles.btnPrimary}
              >
                Aceder à Plataforma <ExternalLink size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Conteúdo dinâmico com base na rota */}
      {route.name === 'landing' && renderLandingPage()}
      {route.name === 'shares' && renderSharesPage()}
      {route.name === 'user' && renderUserPage()}
      {route.name === 'skill' && renderSkillPage()}
      {route.name === 'skillList' && renderSkillListPage()}
      {route.name === 'validar' && renderValidationPage()}

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <div className={styles.logo} onClick={() => navigateTo('/')}>
              <div className={styles.logoIcon}>
                <Award size={20} color="#2563EB" />
              </div>
              <span className={styles.logoText}>
                Soft<span className="text-gradient">Badge.PT</span>
              </span>
            </div>
            <p>Desenvolvendo e validando as competências digitais do futuro.</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <h4>Plataforma</h4>
              <a href="#features" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Recursos</a>
              <a href="#badges" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('badges')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Badges</a>
              <a href="#mobile" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('mobile')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>App Mobile</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('/skill/list'); }}>Competências</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('/validar'); }}>Validar Certificado</a>
            </div>
            <div>
              <h4>Suporte & Info</h4>
              <a href="#">Privacidade</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} SoftBadge.PT - Microsite PINT26. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Botão Flutuante Voltar ao Topo */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={styles.scrollTopButton}
          aria-label="Voltar ao Topo"
          title="Voltar ao Topo"
        >
          <ArrowUp size={22} />
        </button>
      )}
    </div>
  )
}
