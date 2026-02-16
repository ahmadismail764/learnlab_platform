import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  BookOpen,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react'
import { Card, Button, Badge, Input, EmptyState } from '@/components/ui'

/**
 * TopicsManagementPage - Admin Curriculum Structure (UC-07)
 * 
 * Features:
 * - View all topics organized by parent module hierarchy (Step 1-2)
 * - Create new topic with Name + Description + Parent Module (Steps 3-4)
 * - Validation: duplicate name check within module (Alt Flow 3a)
 * - Success confirmation: "Topic created successfully. Ready to add questions." (Step 8)
 * - Edit existing topic — pre-fills form (Alt Flow 2a)
 * - Delete with cascade warning (Alt Flow 5a)
 */

// --- Interfaces ---

interface Topic {
  id: string
  nameKey: string
  name: string
  description: string
  parentModuleId: string
  questionsCount: number
  studentsEnrolled: number
  icon: string
}

interface Module {
  id: string
  nameKey: string
  name: string
  icon: string
  topics: Topic[]
}

type FormMode = 'create' | 'edit'

interface TopicFormData {
  name: string
  description: string
  parentModuleId: string
}

const EMPTY_FORM: TopicFormData = {
  name: '',
  description: '',
  parentModuleId: '',
}

// --- Mock Data ---

const mockModules: Module[] = [
  {
    id: 'logic',
    nameKey: 'topics:logic.title',
    name: 'Logic',
    icon: '🔢',
    topics: [
      { id: 'propositional', nameKey: 'topics:logic.propositional', name: 'Propositional Logic', description: 'Truth tables, logical connectives, compound statements', parentModuleId: 'logic', questionsCount: 20, studentsEnrolled: 45, icon: '→' },
      { id: 'predicates', nameKey: 'topics:logic.predicates', name: 'Predicate Logic', description: 'Predicates, quantified statements, logical equivalences', parentModuleId: 'logic', questionsCount: 15, studentsEnrolled: 38, icon: '∀' },
      { id: 'quantifiers', nameKey: 'topics:logic.quantifiers', name: 'Quantifiers', description: 'Universal and existential quantification, nested quantifiers', parentModuleId: 'logic', questionsCount: 12, studentsEnrolled: 30, icon: '∃' },
      { id: 'proofs', nameKey: 'topics:logic.proofTechniques', name: 'Proof Techniques', description: 'Direct proof, contradiction, contrapositive, induction', parentModuleId: 'logic', questionsCount: 18, studentsEnrolled: 25, icon: '⊢' },
    ],
  },
  {
    id: 'sets',
    nameKey: 'topics:sets.title',
    name: 'Set Theory',
    icon: '∪',
    topics: [
      { id: 'operations', nameKey: 'topics:sets.operations', name: 'Set Operations', description: 'Union, intersection, complement, difference', parentModuleId: 'sets', questionsCount: 16, studentsEnrolled: 48, icon: '∩' },
      { id: 'venn', nameKey: 'topics:sets.vennDiagrams', name: 'Venn Diagrams', description: 'Visual representation of set relationships', parentModuleId: 'sets', questionsCount: 10, studentsEnrolled: 42, icon: '◯' },
      { id: 'power', nameKey: 'topics:sets.powerSets', name: 'Power Sets', description: 'Power set construction, cardinality properties', parentModuleId: 'sets', questionsCount: 12, studentsEnrolled: 28, icon: 'P' },
      { id: 'cartesian', nameKey: 'topics:sets.cartesianProduct', name: 'Cartesian Product', description: 'Ordered pairs, product sets, relation construction', parentModuleId: 'sets', questionsCount: 14, studentsEnrolled: 22, icon: '×' },
    ],
  },
  {
    id: 'relations',
    nameKey: 'topics:relations.title',
    name: 'Relations',
    icon: '≡',
    topics: [
      { id: 'properties', nameKey: 'topics:relations.properties', name: 'Relation Properties', description: 'Reflexive, symmetric, transitive, antisymmetric', parentModuleId: 'relations', questionsCount: 18, studentsEnrolled: 35, icon: 'R' },
      { id: 'equivalence', nameKey: 'topics:relations.equivalence', name: 'Equivalence Relations', description: 'Equivalence classes, partitions, quotient sets', parentModuleId: 'relations', questionsCount: 14, studentsEnrolled: 28, icon: '~' },
      { id: 'partial', nameKey: 'topics:relations.partialOrders', name: 'Partial Orders', description: 'Hasse diagrams, lattices, total orders', parentModuleId: 'relations', questionsCount: 16, studentsEnrolled: 20, icon: '≤' },
      { id: 'functions', nameKey: 'topics:relations.functions', name: 'Functions', description: 'Injective, surjective, bijective, composition', parentModuleId: 'relations', questionsCount: 20, studentsEnrolled: 32, icon: 'f' },
    ],
  },
  {
    id: 'combinatorics',
    nameKey: 'topics:combinatorics.title',
    name: 'Combinatorics',
    icon: '📊',
    topics: [
      { id: 'counting', nameKey: 'topics:combinatorics.counting', name: 'Counting Principles', description: 'Sum rule, product rule, inclusion-exclusion', parentModuleId: 'combinatorics', questionsCount: 14, studentsEnrolled: 40, icon: '#' },
      { id: 'permutations', nameKey: 'topics:combinatorics.permutations', name: 'Permutations', description: 'Arrangements, r-permutations, circular permutations', parentModuleId: 'combinatorics', questionsCount: 12, studentsEnrolled: 36, icon: 'P' },
      { id: 'combinations', nameKey: 'topics:combinatorics.combinations', name: 'Combinations', description: 'Selections, binomial coefficients, Pascals triangle', parentModuleId: 'combinatorics', questionsCount: 12, studentsEnrolled: 30, icon: 'C' },
      { id: 'pigeonhole', nameKey: 'topics:combinatorics.pigeonhole', name: 'Pigeonhole Principle', description: 'Basic and generalized pigeonhole principle', parentModuleId: 'combinatorics', questionsCount: 8, studentsEnrolled: 18, icon: '🕊' },
    ],
  },
  {
    id: 'graphTheory',
    nameKey: 'topics:graphTheory.title',
    name: 'Graph Theory',
    icon: '🔗',
    topics: [
      { id: 'basics', nameKey: 'topics:graphTheory.basics', name: 'Graph Basics', description: 'Vertices, edges, degree, adjacency, graph types', parentModuleId: 'graphTheory', questionsCount: 16, studentsEnrolled: 34, icon: 'G' },
      { id: 'paths', nameKey: 'topics:graphTheory.paths', name: 'Paths & Circuits', description: 'Euler paths, Hamilton circuits, shortest paths', parentModuleId: 'graphTheory', questionsCount: 14, studentsEnrolled: 26, icon: '→' },
      { id: 'trees', nameKey: 'topics:graphTheory.trees', name: 'Trees', description: 'Spanning trees, binary trees, tree traversal', parentModuleId: 'graphTheory', questionsCount: 12, studentsEnrolled: 22, icon: '🌳' },
      { id: 'planarity', nameKey: 'topics:graphTheory.planarity', name: 'Planarity', description: 'Planar graphs, Eulers formula, graph coloring', parentModuleId: 'graphTheory', questionsCount: 10, studentsEnrolled: 16, icon: '◇' },
    ],
  },
  {
    id: 'numberTheory',
    nameKey: 'topics:numberTheory.title',
    name: 'Number Theory',
    icon: '🔢',
    topics: [
      { id: 'divisibility', nameKey: 'topics:numberTheory.divisibility', name: 'Divisibility', description: 'Division algorithm, divisibility rules, factors', parentModuleId: 'numberTheory', questionsCount: 14, studentsEnrolled: 38, icon: '|' },
      { id: 'modular', nameKey: 'topics:numberTheory.modularArithmetic', name: 'Modular Arithmetic', description: 'Congruences, modular operations, applications', parentModuleId: 'numberTheory', questionsCount: 16, studentsEnrolled: 30, icon: '%' },
      { id: 'gcd', nameKey: 'topics:numberTheory.gcd', name: 'GCD & LCM', description: 'Euclidean algorithm, properties of GCD and LCM', parentModuleId: 'numberTheory', questionsCount: 10, studentsEnrolled: 35, icon: '÷' },
      { id: 'primes', nameKey: 'topics:numberTheory.primes', name: 'Prime Numbers', description: 'Sieve of Eratosthenes, prime factorization, FTA', parentModuleId: 'numberTheory', questionsCount: 12, studentsEnrolled: 24, icon: 'p' },
    ],
  },
]

export function TopicsManagementPage() {
  const { t } = useTranslation(['admin', 'common', 'topics'])

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['logic', 'sets']))

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<TopicFormData>({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)

  // Delete confirmation state (UC-07 Alt Flow 5a)
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null)

  // Success message (UC-07 Step 8)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  // Compute stats
  const totalTopics = mockModules.reduce((sum, m) => sum + m.topics.length, 0)
  const totalQuestions = mockModules.reduce((sum, m) => sum + m.topics.reduce((s, t) => s + t.questionsCount, 0), 0)

  // Filtered modules by search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return mockModules
    const q = searchQuery.toLowerCase()
    return mockModules
      .map(mod => ({
        ...mod,
        topics: mod.topics.filter(
          t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        ),
      }))
      .filter(mod => mod.topics.length > 0 || mod.name.toLowerCase().includes(q))
  }, [searchQuery])

  // --- Form handlers ---

  const openCreateForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM })
    setFormErrors({})
    setFormMode('create')
    setEditingTopicId(null)
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((topic: Topic) => {
    setFormData({
      name: topic.name,
      description: topic.description,
      parentModuleId: topic.parentModuleId,
    })
    setFormErrors({})
    setFormMode('edit')
    setEditingTopicId(topic.id)
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setFormData({ ...EMPTY_FORM })
    setFormErrors({})
    setEditingTopicId(null)
  }, [])

  // UC-07 Alt Flow 3a: Validate uniqueness
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = t('admin:topicsManagement.form.errorName')
    }

    if (!formData.parentModuleId) {
      errors.parentModuleId = t('admin:topicsManagement.form.errorModule')
    }

    // Check duplicate name within same module
    if (formData.name.trim() && formData.parentModuleId) {
      const parentModule = mockModules.find(m => m.id === formData.parentModuleId)
      if (parentModule) {
        const duplicate = parentModule.topics.find(
          t => t.name.toLowerCase() === formData.name.trim().toLowerCase()
            && t.id !== editingTopicId
        )
        if (duplicate) {
          errors.name = t('admin:topicsManagement.form.errorDuplicate')
        }
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, editingTopicId, t])

  // UC-07 Steps 5-8: Save
  const handleSave = useCallback(() => {
    if (!validateForm()) return

    // Static: just show success toast
    const msg = formMode === 'create'
      ? t('admin:topicsManagement.form.createSuccess')
      : t('admin:topicsManagement.form.updateSuccess')

    setSuccessMessage(msg)
    closeForm()

    // Auto-hide success
    setTimeout(() => setSuccessMessage(null), 4000)
  }, [validateForm, formMode, t, closeForm])

  // UC-07 Alt Flow 5a: Delete
  const handleDelete = useCallback(() => {
    if (!deleteTarget) return
    setSuccessMessage(t('admin:topicsManagement.form.deleteSuccess'))
    setDeleteTarget(null)
    setTimeout(() => setSuccessMessage(null), 4000)
  }, [deleteTarget, t])

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {successMessage && (
        <div className="fixed top-4 end-4 z-50 flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl shadow-lg border border-green-200 dark:border-green-800 animate-in slide-in-from-top">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ms-2 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {t('admin:topicsManagement.title')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {t('admin:topicsManagement.subtitle')}
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateForm}>
          {t('admin:topicsManagement.addTopic')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FolderTree className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{mockModules.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:topicsManagement.stats.modules')}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalTopics}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:topicsManagement.stats.topics')}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalQuestions}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:topicsManagement.stats.questions')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('admin:topicsManagement.searchPlaceholder')}
          className="ps-10"
        />
      </div>

      {/* Module hierarchy */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title={t('common:noResults')}
            description={t('admin:tryDifferentFilters')}
          />
        ) : (
          filteredModules.map((mod) => {
            const isExpanded = expandedModules.has(mod.id)
            const moduleQuestions = mod.topics.reduce((sum, t) => sum + t.questionsCount, 0)

            return (
              <Card key={mod.id} className="overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-2xl">{mod.icon}</span>
                  <div className="flex-1 text-start">
                    <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {t(mod.nameKey)}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t('admin:topicsManagement.topicCount', { count: mod.topics.length })} · {t('admin:topicsManagement.questionCount', { count: moduleQuestions })}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    {mod.topics.length} {t('admin:topicsManagement.stats.topics').toLowerCase()}
                  </Badge>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-neutral-400 rtl:rotate-180" />
                  )}
                </button>

                {/* Topic list within module */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 dark:border-neutral-700">
                    {mod.topics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={`p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                          index !== mod.topics.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono shrink-0">
                          {topic.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                            {t(topic.nameKey)}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                            {topic.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            <span>{topic.questionsCount} {t('admin:topicsManagement.questionsLabel')}</span>
                            <span>{topic.studentsEnrolled} {t('admin:topicsManagement.studentsLabel')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditForm(topic)} title={t('common:edit')}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(topic)} title={t('common:delete')} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* ═══════ Create / Edit Form Modal (UC-07 Steps 3-7) ═══════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Form header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  {formMode === 'create'
                    ? t('admin:topicsManagement.form.createTitle')
                    : t('admin:topicsManagement.form.editTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('admin:topicsManagement.form.subtitle')}
                </p>
              </div>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Form body */}
            <div className="p-6 space-y-5">
              {/* Topic Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.topicName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
                  }}
                  placeholder={t('admin:topicsManagement.form.namePlaceholder')}
                  className={formErrors.name ? 'border-red-500 dark:border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.description')} <span className="text-neutral-400 text-xs">({t('common:optional')})</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('admin:topicsManagement.form.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              {/* Parent Module */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.parentModule')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.parentModuleId}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, parentModuleId: e.target.value }))
                    if (formErrors.parentModuleId) setFormErrors(prev => ({ ...prev, parentModuleId: '' }))
                  }}
                  className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors ${
                    formErrors.parentModuleId ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  aria-label={t('admin:topicsManagement.form.parentModule')}
                >
                  <option value="">{t('admin:topicsManagement.form.selectModule')}</option>
                  {mockModules.map(mod => (
                    <option key={mod.id} value={mod.id}>
                      {mod.icon} {t(mod.nameKey)}
                    </option>
                  ))}
                </select>
                {formErrors.parentModuleId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {formErrors.parentModuleId}
                  </p>
                )}
              </div>
            </div>

            {/* Form footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="outline" onClick={closeForm}>
                {t('common:cancel')}
              </Button>
              <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSave}>
                {formMode === 'create'
                  ? t('admin:topicsManagement.form.saveTopic')
                  : t('admin:topicsManagement.form.updateTopic')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Delete Confirmation Dialog (UC-07 Alt Flow 5a) ═══════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    {t('admin:topicsManagement.delete.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {t('admin:topicsManagement.delete.description')}
                  </p>
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {t('admin:topicsManagement.delete.cascadeWarning')}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">
                    {t('admin:topicsManagement.delete.topicLabel')}: <strong>{deleteTarget.name}</strong>
                    <br />
                    {t('admin:topicsManagement.delete.questionsAffected', { count: deleteTarget.questionsCount })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                {t('common:cancel')}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleDelete}
              >
                {t('common:delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
