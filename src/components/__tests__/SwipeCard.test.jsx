import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SwipeCard from '../SwipeCard'

describe('SwipeCard', () => {
  const mockGame = {
    id: 1,
    name: 'Test Game',
    background_image: 'https://example.com/image.jpg',
    rating: 4.5,
    genres: [{ name: 'Action' }, { name: 'Adventure' }]
  }

  it('renders game name', () => {
    render(
      <SwipeCard
        game={mockGame}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        onCardClick={vi.fn()}
      />
    )
    expect(screen.getByText('Test Game')).toBeInTheDocument()
  })

  it('renders game rating', () => {
    render(
      <SwipeCard
        game={mockGame}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        onCardClick={vi.fn()}
      />
    )
    expect(screen.getByText('⭐ 4.5')).toBeInTheDocument()
  })

  it('renders genres', () => {
    render(
      <SwipeCard
        game={mockGame}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        onCardClick={vi.fn()}
      />
    )
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Adventure')).toBeInTheDocument()
  })
})
